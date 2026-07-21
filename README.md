# @core/common

Shared CRUD engine for NestJS microservices. Auto-generates REST controllers with per-operation access control, Swagger docs, and TypeORM row-level security.

## Installation

```bash
# From tarball (local dev)
npm install @core/common@file:../shared/core-common-1.0.0.tgz

# Rebuild after changes
cd shared/ && npm run build && npm pack
```

## Building

```bash
cd shared/
npm install
npm run build   # src/ -> dist/
npm pack        # -> core-common-1.0.0.tgz
```

---

## Access Control Model

Five independent restriction levels. Each CRUD operation (create, read, update, delete) gets its **own** level — they are configured independently.

### The Five Levels

| Level | Authentication | Row scoping | Superuser bypass |
|-------|---------------|-------------|------------------|
| `public` | Token **optional** | None | N/A |
| `account` | Token **required** (401) | None — sees all records | N/A |
| `owner` | Token **required** (401) | `WHERE account.id = caller.id` | Yes — bypasses scoping |
| `admin` | Token **required** (401) | 403 if `!isSuperuser` | N/A (only superuser passes) |
| `closed` | Route **not generated** | — | No one |

### Access Matrix — Who Can Do What

| Level | Unauthenticated | Authenticated (not owner) | Record Owner | Superuser |
|-------|:---:|:---:|:---:|:---:|
| `public` | 200 | 200 | 200 | 200 |
| `account` | 401 | 200 | 200 | 200 |
| `owner` | 401 | 404 | 200 | 200 *(bypass)* |
| `admin` | 401 | 403 | 403 | 200 |
| `closed` | 404 | 404 | 404 | 404 |

### Levels Are NOT Cumulative

These are **independent restriction modes**, not a hierarchy where each level includes the previous one's permissions:

1. **`admin` does NOT include `owner`** — at the `admin` level, the record owner gets **403** unless they are also a superuser. Being the owner of a record grants nothing at `admin` level.

2. **`owner` does NOT include `account`** — at the `owner` level, a regular authenticated user gets **404** on someone else's record. Being authenticated grants nothing — you must be the specific owner of that record.

3. **The only overlap** — superuser bypass at the `owner` level: if `account.isSuperuser === true`, row scoping is skipped and all records are visible. This is a bypass within one level, not cumulative behavior between levels.

### Per-Operation Configuration

Each operation gets its own level via the `operations` option:

```typescript
@EntityController({
  name: 'posts',
  dto: PostDto,
  entity: PostEntity,
  operations: {
    read:   'public',   // anyone can read
    create: 'account',  // any logged-in user can create
    update: 'owner',    // only the author can edit
    delete: 'admin',    // only superuser can delete (not even the author!)
  },
})
```

If `operations` is omitted, **all operations default to `public`**.

### Common Patterns

```typescript
// Public catalog — anyone can read, no writes via API
@EntityController({
  operations: { read: 'public', create: 'closed', update: 'closed', delete: 'closed' },
})

// User settings — only owner can do everything
@EntityController({
  operations: { read: 'owner', create: 'owner', update: 'owner', delete: 'owner' },
})

// Admin panel — superuser only
@EntityController({
  operations: { read: 'admin', create: 'admin', update: 'admin', delete: 'admin' },
})

// Blog — public reads, authenticated authors, owner edits, admin deletes
@EntityController({
  operations: { read: 'public', create: 'account', update: 'owner', delete: 'admin' },
})
```

---

## EntityController

Class-decorator factory that generates a full CRUD controller with guards and Swagger docs.

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | `string` | *required* | Entity name (used in Swagger tag + route base) |
| `dto` | `class` | *required* | DTO class extending `CommonDto` |
| `entity` | `class` | *required* | TypeORM entity class |
| `operations` | `Partial<OperationConfig>` | `{ read: 'public', create: 'public', update: 'public', delete: 'public' }` | Access level per operation |
| `accountTable` | `string` | `'account'` | Relation name for owner row scoping |
| `accountField` | `string` | `'id'` | Account field to match against |

### Usage

```typescript
import { EntityController, CommonService } from '@core/common';

@EntityController({
  name: 'posts',
  dto: PostDto,
  entity: PostEntity,
  operations: { read: 'public', create: 'account', update: 'owner', delete: 'admin' },
})
export class PostController extends BaseEntityController {
  constructor(readonly service: PostService) {
    super();
  }
}
```

### Auto-Generated Routes

Routes are generated based on access levels. `closed` operations produce **no route** (404).

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `GET` | `/find` | read | List with search, where, order, limit, offset, relations |
| `GET` | `/find/first` | read | First matching record |
| `GET` | `/find/many/:ids` | read | Multiple records by comma-separated IDs |
| `GET` | `/find/:id` | read | Single record by ID |
| `GET` | `/count` | read | Count with where, limit, offset |
| `GET` | `/self` | read | **Only when `read: 'owner'`** — caller's records only |
| `POST` | `/create` | create | Create with relations |
| `PATCH` | `/update/:id` | update | Update by ID with relations |
| `DELETE` | `/remove/:id` | delete | Remove by ID (returns `true`/`false`) |
| `POST` | `/position/sort` | update | Re-sort positions |
| `POST` | `/position/move/:id` | update | Move record to position |

### The `self` Endpoint

Only generated when `read: 'owner'`. Returns records owned by the caller (`WHERE account.id = caller.id`), **without** superuser bypass — even superusers only see their own records.

```typescript
// self route IS generated (read = 'owner')
@EntityController({ operations: { read: 'owner', ... } })

// self route is NOT generated (read = 'account')
@EntityController({ operations: { read: 'account', ... } })
```

### The `closed` Level

When an operation is `closed`, the route is **not generated at all**. Requests return **404 Not Found**, not 403 Forbidden. This hides the endpoint's existence.

```typescript
@EntityController({
  operations: { read: 'public', create: 'closed', update: 'closed', delete: 'closed' },
})
// GET /find → 200
// POST /create → 404 (route doesn't exist)
// PATCH /update/1 → 404
// DELETE /remove/1 → 404
```

### Owner Row Scoping — How It Works

When `owner` level is active, `resolveBind()` creates a `BindDto` that adds a WHERE clause to every query:

```
bind = { id: <caller_account_id>, name: 'account', key: 'id', allow: false }
```

In `CommonService.find()`, this becomes:

```sql
SELECT * FROM posts WHERE account_id = <caller_account_id>
```

For `findOne` and `update`, if the record doesn't match the caller's account, it's not found → **404**.

For `remove`, the record is not found → returns **`false`** (not an error).

#### Multi-Hop Owner Relations

If the account relation is nested (e.g., `post → organization → account`), use `bindPath`:

```typescript
@EntityController({
  operations: {
    read: { level: 'owner', bindPath: 'organization.account' },
    // ...
  },
})
```

This generates nested WHERE:

```sql
SELECT * FROM posts
  JOIN organizations ON posts.organization_id = organizations.id
  WHERE organizations.account_id = <caller_account_id>
```

---

## Guards & Decorators

| Export | Description |
|--------|-------------|
| `@Account()` | Applies JWT `AuthGuard` — throws 401 if no valid token |
| `@Account('noBlock')` | Applies JWT guard but **does not throw** if no token (user is `undefined`) |
| `@Self()` | Param decorator — extracts `request.user`, throws 403 if missing |
| `@Self('noBlock')` | Same, but returns `undefined` instead of throwing |
| `@Secure` | `@UseGuards(SecureGuard)` — token-based access |
| `@SimpleSecure` | `@UseGuards(SimpleSecureGuard)` — lightweight token check |
| `@Data()` | Param decorator — merges `request.query` + `request.body`, JSON-parses strings |
| `@FieldAccess({ read, write })` | Property decorator — field-level access control on entity columns |
| `@Doc(name, dto)` | Composes Swagger documentation decorators |

### Field-Level Access

```typescript
@Entity()
class UserEntity extends BaseEntity {
  @VarcharColumn()
  @FieldAccess({ read: 'public' })
  username: string;

  @VarcharColumn()
  @FieldAccess({ read: 'owner', write: 'owner' })
  email: string;

  @VarcharColumn()
  @FieldAccess({ read: 'admin', write: 'admin' })
  internalNotes: string;
}
```

Fields with `read: 'owner'` are stripped from responses unless the caller is the record owner or superuser. Fields with `read: 'admin'` are stripped unless the caller is a superuser.

---

## CommonService

Generic CRUD service backing the generated controller.

```typescript
class PostService extends CommonService<PostDto, PostEntity> {
  constructor(
    @InjectRepository(PostEntity) repo: Repository<PostEntity>,
  ) {
    super(repo, PostDto, PostEntity);
  }
}
```

### Methods

| Method | Description |
|--------|-------------|
| `find(findDto, bind?)` | List with search/where/order/limit/offset/relations |
| `findOne(findOneDto, bind?)` | Single record by ID |
| `findMany(findManyDto, bind?)` | Multiple records by IDs array |
| `findFirst(findFirstDto, bind?)` | First matching record |
| `count(findDto, bind?)` | Count matching records |
| `create(dto, relations?, bind?)` | Create with nested relations |
| `update(id, dto, relations?, bind?)` | Update by ID |
| `remove(id, bind?)` | Remove by ID — returns `false` if not found (no throw) |
| `sortPosition(field, findDto, bind?)` | Re-sort all records by field |
| `movePosition(id, field, position?, bind?)` | Move record to specific position |

The `bind` parameter controls row scoping. When omitted, defaults to `{ allow: true }` (no scoping).

---

## Column Factories

TypeORM column helpers for consistent entity definitions.

### Identity & Timestamps

| Factory | Type | Description |
|---------|------|-------------|
| `IdColumn()` | `bigint` PK | Auto-increment primary key |
| `CreatedColumn()` | `timestamp` | `createdAt` — set on insert |
| `UpdatedColumn()` | `timestamp` | `updatedAt` — set on insert + update |

### Data Types

| Factory | Type | Description |
|---------|------|-------------|
| `VarcharColumn()` | `varchar` | String (configurable length, default 255) |
| `TextColumn()` | `text` | Long text |
| `BooleanColumn()` | `boolean` | True/false |
| `IntColumn()` | `int` | Integer |
| `SmallIntColumn()` | `smallint` | Small integer |
| `BigIntColumn()` | `bigint` | Big integer |
| `FloatColumn()` | `float` | Floating point |
| `DateColumn()` | `date` | Date |
| `EnumColumn()` | `enum` | Enum value |
| `JsonColumn()` | `jsonb` | JSON object/array |

### Sorting

| Factory | Type | Description |
|---------|------|-------------|
| `PositionAscColumn()` | `int` | Ascending sort position |
| `PositionDescColumn()` | `int` | Descending sort position |

### DTO-Bound Columns

Mirrors a field from the DTO class, automatically synced:

| Factory | Description |
|---------|-------------|
| `DtoColumn(DtoClass, 'field')` | Column from DTO field |
| `DtoCreatedColumn(DtoClass)` | `createdAt` from DTO |
| `DtoUpdatedColumn(DtoClass)` | `updatedAt` from DTO |
| `DtoEnumColumn(DtoClass, 'field')` | Enum column from DTO |
| `DtoJsonColumn(DtoClass, 'field')` | JSON column from DTO |

### Indexed

| Factory | Description |
|---------|-------------|
| `IndexedColumn(columnFn)` | Wraps any column factory with an index |

---

## CommonDto

Base DTO class. Extend it to define entity payloads:

```typescript
class PostDto extends CommonDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
```

---

## PermissionRegistry

In-memory map recording per-entity access levels. Populated automatically by `@EntityController`, queryable at runtime:

```typescript
import { PermissionRegistry } from '@core/common';

const config = PermissionRegistry.get(PostEntity);
// { create: 'account', read: 'public', update: 'owner', delete: 'admin' }
```

Used internally by `sanitizeForSave()` to determine whether nested relation creates are allowed based on the related entity's `create` access level.
