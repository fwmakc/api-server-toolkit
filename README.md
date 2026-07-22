# api-server-toolkit

Shared CRUD engine for NestJS microservices. Auto-generates REST controllers with multi-layer access control, Swagger docs, and TypeORM row-level security.

## Installation

```bash
npm install github:fwmakc/api-server-toolkit#master
```

npm clones the repo and runs the `prepare` script automatically, which builds `dist/` via `tsc`. No manual build step needed.

---

## Security model: deny by default

The framework applies four layers of access control. Three of them default to **closed** —
the developer must explicitly open access. This ensures a safe failure mode: if you
forget to configure something, nothing leaks.

| Layer | Default | What it controls |
|-------|---------|------------------|
| **Operations** | `closed` | Which CRUD routes exist (create, read, update, delete) |
| **Relations** | deny all | Which nested relations can be loaded in responses |
| **Nested filtering** | automatic | Related entities filtered by caller identity everywhere they appear |
| **Fields** | `public` | Which entity fields are visible/writable (dev marks sensitive ones) |

**Safe failure:** developer forgets to configure → nothing works, nothing leaks.
**Unsafe failure (old model):** developer forgets → everything public, silent leak.

### Request flow through the four layers

```
Client request
    │
    ▼
┌─────────────────────────────────────┐
│ Layer 1: Operations (deny default)  │
│  Is this route generated?           │
│  closed → 404                       │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Layer 2: Access level guard         │
│  public → token optional            │
│  account/owner → token required     │
│  admin → superuser required         │
│  owner → WHERE bind filters rows    │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Layer 3: Relations whitelist        │
│  Requested relation in whitelist?   │
│  NO → strip (silently removed)      │
│  YES → load                         │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Layer 3b: Nested auto-filtering     │
│  Loaded entity has accountTable?    │
│  YES → keep only caller's records   │
│  NO → leave as-is                   │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Layer 4: Field-level access         │
│  @FieldAccess per field:            │
│  owner → strip if not owner         │
│  admin → strip if not superuser     │
│  closed → always strip              │
└─────────────────────────────────────┘
    │
    ▼
  Response
```

---

## Access levels

Five independent restriction levels. Each CRUD operation gets its **own** level.

### The five levels

| Level | Authentication | Row scoping | Superuser bypass |
|-------|---------------|-------------|------------------|
| `public` | Token **optional** | None | N/A |
| `account` | Token **required** (401) | None — sees all records | N/A |
| `owner` | Token **required** (401) | `WHERE ... = caller.id` | Yes — bypasses scoping |
| `admin` | Token **required** (401) | 403 if `!isSuperuser` | N/A (only superuser passes) |
| `closed` | Route **not generated** | — | No one |

### Access matrix — who can do what

| Level | Unauthenticated | Authenticated (not owner) | Record Owner | Superuser |
|-------|:---:|:---:|:---:|:---:|
| `public` | 200 | 200 | 200 | 200 |
| `account` | 401 | 200 | 200 | 200 |
| `owner` | 401 | 404 | 200 | 200 *(bypass)* |
| `admin` | 401 | 403 | 403 | 200 |
| `closed` | 404 | 404 | 404 | 404 |

### Levels are NOT cumulative

These are **independent restriction modes**, not a hierarchy:

1. **`admin` does NOT include `owner`** — the record owner gets 403 at `admin` level
   unless they are also a superuser.
2. **`owner` does NOT include `account`** — a regular authenticated user gets 404 on
   someone else's record. Being authenticated grants nothing.
3. **The only overlap** — superuser bypass at the `owner` level: if
   `account.isSuperuser === true`, row scoping is skipped.

---

## EntityController

Class-decorator factory that generates a full CRUD controller with guards, Swagger docs,
and access control registration.

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | `string` | *required* | Entity name (Swagger tag + route base) |
| `dto` | `class` | *required* | DTO class extending `CommonDto` |
| `entity` | `class` | *required* | TypeORM entity class |
| `operations` | `Partial<OperationConfig>` | all `closed` | Access level per CRUD operation |
| `accountTable` | `string` | `'account'` | Relation path from entity to account (supports dot-notation for multi-hop) |
| `accountField` | `string` | `'id'` | Account field to match against caller id |
| `relations` | `string[]` | `[]` (deny all) | Whitelist of relation paths allowed in responses |

### Basic usage

```typescript
import { EntityController, CommonService } from 'api-server-toolkit';

@EntityController({
  name: 'posts',
  dto: PostDto,
  entity: PostEntity,
  operations: { read: 'public', create: 'account', update: 'owner', delete: 'admin' },
  relations: ['tags'],  // only tags can be loaded; everything else stripped
})
export class PostController extends BaseEntityController {
  constructor(readonly service: PostService) {
    super();
  }
}
```

### Operations: deny by default

If `operations` is omitted or partially specified, missing operations default to
`'closed'` — the route is not generated (404).

```typescript
// Only read route exists; create/update/delete → 404
@EntityController({
  operations: { read: 'public' },
})

// Nothing exists — all routes → 404
@EntityController({
  // operations omitted
})
```

### Common patterns

```typescript
// Public catalog — anyone can read, no writes
@EntityController({
  operations: { read: 'public', create: 'closed', update: 'closed', delete: 'closed' },
})

// User settings — only owner can do everything
@EntityController({
  accountTable: 'account',
  operations: { read: 'owner', create: 'owner', update: 'owner', delete: 'owner' },
})

// Admin panel — superuser only
@EntityController({
  operations: { read: 'admin', create: 'admin', update: 'admin', delete: 'admin' },
})
```

### Auto-generated routes

Routes are generated based on access levels. `closed` operations produce **no route**.

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| `GET` | `/find` | read | List with search, where, order, limit, offset, relations |
| `GET` | `/find/first` | read | First matching record |
| `GET` | `/find/many/:ids` | read | Multiple records by comma-separated IDs |
| `GET` | `/find/:id` | read | Single record by ID |
| `GET` | `/count` | read | Count matching records |
| `GET` | `/self` | read | **Only when `read: 'owner'`** — caller's records only |
| `POST` | `/create` | create | Create with relations |
| `PATCH` | `/update/:id` | update | Update by ID with relations |
| `DELETE` | `/remove/:id` | delete | Remove by ID (returns `true`/`false`) |
| `POST` | `/position/sort` | update | Re-sort positions |
| `POST` | `/position/move/:id` | update | Move record to position |

### The `self` endpoint

Only generated when `read: 'owner'`. Returns records owned by the caller, **without**
superuser bypass — even superusers only see their own records.

```typescript
// self route IS generated
@EntityController({ operations: { read: 'owner', ... } })

// self route is NOT generated
@EntityController({ operations: { read: 'account', ... } })
```

---

## Owner row scoping

When `owner` level is active, a `BindDto` adds a WHERE clause to every query.

### Single-hop (direct account relation)

```typescript
@EntityController({
  accountTable: 'account',  // default
  operations: { read: 'owner', ... },
})
```

Generated SQL:

```sql
SELECT * FROM posts WHERE account_id = <caller_account_id>
```

For `findOne`/`update`: if the record doesn't match → **404**.
For `remove`: if the record doesn't match → returns **`false`** (no error).

### Multi-hop (indirect relation via junction tables)

When the connection to the account spans multiple tables, use dot-notation in
`accountTable`:

```typescript
@EntityController({
  accountTable: 'enrolls.student.account',
  operations: { read: 'owner', create: 'admin', update: 'admin', delete: 'admin' },
})
```

The entity chain (`courses → enrolls → students → accounts`):

```sql
SELECT * FROM courses
  JOIN enrolls  ON enrolls.course_id   = courses.id
  JOIN students ON enrolls.student_id  = students.id
  JOIN accounts ON students.email      = accounts.username
  WHERE accounts.id = $1
```

**Path direction:** entity → account (left to right). The first segment is a relation
on the entity being configured; the last segment reaches the account table.

**Entity setup requirements:**

1. The entity must have a relation path resolvable through dot-notation.
2. Non-PK joins require explicit `@JoinColumn` with `referencedColumnName`.
3. The referenced column must have a **UNIQUE** constraint (PostgreSQL requirement).

```typescript
@Entity({ name: 'students' })
class StudentEntity extends BaseEntity {
  @IdColumn() id: number;

  @VarcharColumn('email') email: string;

  @OneToMany(() => EnrollEntity, (e) => e.student)
  enrolls: EnrollEntity[];

  // Non-PK join: student.email → account.username
  @OneToOne(() => AccountEntity)
  @JoinColumn({ name: 'email', referencedColumnName: 'username' })
  account: AccountEntity;
}
```

### Per-operation bindPath override

For fine-grained control, individual operations can specify their own bindPath:

```typescript
@EntityController({
  accountTable: 'enrolls.student.account',
  operations: {
    read:   { level: 'owner', bindPath: 'enrolls.student.account' },
    update: { level: 'owner', bindPath: 'account' },  // different path
  },
})
```

If `bindPath` is omitted on an `owner` operation, the controller-level `accountTable`
is used as fallback.

### Auto-assign on create

When `create: 'owner'`, the system auto-assigns the caller's relation to the new record.

**Single-hop** (direct): resolves account id directly.

```
bind = { id: 1, name: 'account' }
→ dto.account = { id: 1 }
```

**Multi-hop**: walks the chain backward to find the first segment's id.

```
bind = { id: 1, name: 'student.account' }

1. Find student linked to caller's account:
   SELECT students.id FROM students
     JOIN accounts ON students.email = accounts.username
     WHERE accounts.id = 1
   → student.id = 1

2. dto.student = { id: 1 }
```

**Rules:**
- First segment must be a ToOne relation (ManyToOne/OneToOne). ToMany is skipped
  (doesn't make sense for collections).
- If no matching entity found → `throw NotFoundException`.
- Affects `create()` and `upsert()`.

### Deduplication

When a multi-hop JOIN produces duplicate root entities (e.g., a course matched by
multiple enrollments), the framework deduplicates by `id`. Each course appears once.

This only applies when the root entity has multiple matching paths. When querying
enrollments directly (each enroll is unique), no duplicates occur.

### Pagination with multi-hop

When using `limit`/`offset` with multi-hop bind, the framework uses a two-step query
to ensure correct pagination:

```
Step 1: SELECT DISTINCT courses.id ... LIMIT 10 OFFSET 0 → [1, 3, 5, ...]
Step 2: SELECT * FROM courses WHERE id IN (1, 3, 5, ...) → load entities + relations
```

Without pagination — regular query with dedup.

---

## Relations

### Whitelist: deny by default

By default, **no relations** are loaded in responses. The developer must explicitly
whitelist allowed relation paths:

```typescript
@EntityController({
  relations: ['enrolls'],  // only 'enrolls' allowed
})
```

**Matching rule:** the requested relation path must **exactly match** an entry in the
whitelist.

```typescript
relations: ['enrolls']

// Client requests:
✅ { name: 'enrolls' }                → allowed
❌ { name: 'enrolls.student' }        → stripped (not in whitelist)
❌ { name: 'enrolls.student.account' } → stripped
❌ { name: 'tags' }                   → stripped
```

To allow nested paths, list them explicitly:

```typescript
relations: ['enrolls', 'enrolls.student']

✅ { name: 'enrolls' }                → allowed
✅ { name: 'enrolls.student' }        → allowed
❌ { name: 'enrolls.student.account' } → stripped
```

**If `relations` is omitted** → no relations loaded at all (deny all).

**Violation behavior:** requested but non-whitelisted relations are **silently stripped**.
The request still processes — the client gets data without the stripped relations.

### Nested relation auto-filtering

When a relation is loaded, the framework automatically filters related entities that
have access control registered. This prevents seeing other users' data through nested
relations.

**How it works:**

1. Each `@EntityController` registers its entity and `accountTable` in
   `PermissionRegistry`.
2. After loading relations, the framework walks the result tree.
3. For each nested entity found, it checks `PermissionRegistry`.
4. If the entity has an `accountTable`, the array is filtered to keep only records
   owned by the caller.
5. If the entity is not registered → no filtering (no access control for that entity).

**Example:**

Alice loads her enrollments with the course and its enrollments:

```json
{
  "relations": [
    { "name": "course" },
    { "name": "course.enrolls" }
  ]
}
```

```
enroll (Alice's)                          ← filtered by enrolls controller bind ✓
  └─ course (Programming)
       └─ enrolls: [
            Alice's enroll  → student.account.id = 1 → KEEP ✓
            Bob's enroll    → student.account.id = 2 → REMOVE ✗
          ]
```

Bob's enrollment is automatically filtered out because `EnrollEntity` is registered
in `PermissionRegistry` with `accountTable: 'student.account'`.

**Important:** if an entity type has no controller (no `@EntityController`), it won't
be in `PermissionRegistry` and won't be filtered. The developer must create a
controller to enable filtering.

### Sorting relations

Relations can be sorted in the response using the `order` and `desc` fields:

```json
{
  "relations": [
    { "name": "enrolls", "order": "createdAt", "desc": true }
  ]
}
```

Sorting is applied post-load, after TypeORM returns the data.

---

## Field-level access

### `@FieldAccess` decorator

Controls visibility and writability of individual entity fields. Fields without
`@FieldAccess` default to `public` (visible to all, writable by all).

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

  @VarcharColumn()
  @FieldAccess({ read: 'closed' })
  passwordHash: string;

  @FieldAccess({ write: 'closed' })
  @VarcharColumn()
  lockedField: string;
}
```

| `read` level | Who sees the field |
|---|---|
| `public` | Everyone (default) |
| `account` | Any authenticated user |
| `owner` | Record owner or superuser |
| `admin` | Superuser only |
| `closed` | No one (always stripped) |

| `write` level | Who can set/modify the field |
|---|---|
| `public` | Anyone via create/update (default) |
| `owner` | Owner-only (checked at service level) |
| `admin` | Superuser only |
| `closed` | Never (always stripped from input) |

### Nested field access (bind propagation)

When processing nested entities in a response, the bind path is **propagated and
adjusted** for each level of nesting. This ensures field-level access works correctly
on related entities, not just the root.

**How bind propagates when recursing into a nested entity via key `K`:**

| Situation | Bind for nested entity | Result |
|---|---|---|
| `bind.name` starts with `K.` | Strip `K.` from path | Ownership checked via remaining chain |
| `bind.name === K` | `name: ''` | Entity itself is the owner candidate |
| `bind.name` doesn't match `K` | `name: ''` | Entity itself checked against `bind.id` |

**When `name === ''`:** the entity itself is treated as the owner candidate. If
`dto.id === bind.id`, owner fields are visible. Otherwise, they are stripped.

**Examples:**

Course (bind: `enrolls.student.account`):

```
→ recurse into 'enrolls'
  → Enroll bind: 'student.account'
  → dto.student.account.id === caller.id? → owner fields checked ✓

→ recurse into 'tags' (off bind path)
  → Tag bind: { name: '', id: caller.id }
  → tag.id ≠ caller.id → owner fields stripped ✓
  → public/account fields still visible ✓

→ recurse from student into 'account' (end of path)
  → Account bind: { name: '', id: caller.id }
  → account.id === caller.id → owner fields visible ✓
```

**Superuser** (`allow: true`): all fields visible regardless of bind path.

---

## Nested write protection

When creating or updating records with nested relation data, the framework prevents
modifying related entities you don't own.

### `sanitizeForSave`

Strips unauthorized fields from nested entities before saving:

- **Existing relation (has `id`):** only `{ id }` is kept — all other fields are
  stripped. You can link to an existing record, but not modify it through a nested
  write.

  ```json
  // Input: { "course": { "id": 1, "title": "Hacked" } }
  // After sanitize: { "course": { "id": 1 } }
  ```

- **New relation (no `id`):** checks `PermissionRegistry` for the related entity's
  `create` access level. If the caller doesn't have permission, the relation is
  removed entirely.

  ```json
  // If CourseEntity has create: 'admin' and caller is not superuser:
  // Input: { "course": { "title": "New Course" } }
  // After sanitize: {} (relation stripped)
  ```

### `stripWriteFields`

Removes fields with `write: 'admin'` or `write: 'closed'` from the input DTO before
saving, based on the caller's permissions.

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

---

## SafeIdPipe

Validates that an ID is a non-empty string of digits, returning it as a `string`
(preserving bigint precision for IDs exceeding `Number.MAX_SAFE_INTEGER`).

Replaces `ParseIntPipe` in all four `EntityController` route params (`findOne`,
`findMany`, `update`, `remove`). Service signatures accept `number | string`.

```typescript
// route: GET /posts/:id
findOne(@Param('id', SafeIdPipe) id: string) { … }  // "9223372036854775807"
```

- Rejects non-numeric strings with `400 Bad Request`.
- Returns the raw string — no precision loss through `parseInt`.
- Exported from `api-server-toolkit/pipe`.

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
| `upsert(dto, relations?, bind?)` | Create or update by unique columns |
| `remove(id, bind?)` | Remove by ID — returns `false` if not found (no throw) |
| `sortPosition(field, findDto, bind?)` | Re-sort all records by field |
| `movePosition(id, field, position?, bind?)` | Move record to specific position |
| `toCsv(findDto, bind?)` | Export matching records to CSV |

The `bind` parameter controls row scoping. When omitted, defaults to `{ allow: true }`
(no scoping).

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

In-memory map recording per-entity access configuration. Populated **automatically** by
`@EntityController` — the developer never calls it directly.

### What it stores

```typescript
// Automatically set by EntityController factory:
PermissionRegistry.set(CourseEntity, {
  create: 'admin',
  read: 'owner',
  update: 'admin',
  delete: 'admin',
  accountTable: 'enrolls.student.account',
});

PermissionRegistry.set(EnrollEntity, {
  create: 'owner',
  read: 'owner',
  update: 'owner',
  delete: 'owner',
  accountTable: 'student.account',
});

// StudentEntity has no controller → not in Registry → not filtered in nested relations
```

### How it's used

1. **`sanitizeForSave()`** — checks `create` level before allowing nested relation
   creates.
2. **Nested relation filtering** — checks `accountTable` to filter related entities
   by caller identity.
3. **Runtime queries** — developers can inspect access config:

```typescript
import { PermissionRegistry } from 'api-server-toolkit';

const config = PermissionRegistry.get(CourseEntity);
// { create: 'admin', read: 'owner', update: 'admin', delete: 'admin',
//   accountTable: 'enrolls.student.account' }
```

---

## Complete example: enrollment-based access

### Entities

```typescript
@Entity({ name: 'courses' })
class CourseEntity extends BaseEntity {
  @IdColumn() id: number;
  @VarcharColumn('title') title: string;

  @OneToMany(() => EnrollEntity, (e) => e.course)
  enrolls: EnrollEntity[];
}

@Entity({ name: 'enrolls' })
class EnrollEntity extends BaseEntity {
  @IdColumn() id: number;
  @VarcharColumn('status') status: string;
  @CreatedColumn() createdAt?: Date;

  @ManyToOne(() => CourseEntity, (c) => c.enrolls)
  course: CourseEntity;

  @ManyToOne(() => StudentEntity, (s) => s.enrolls)
  student: StudentEntity;
}

@Entity({ name: 'students' })
class StudentEntity extends BaseEntity {
  @IdColumn() id: number;
  @VarcharColumn('email') email: string;

  @OneToMany(() => EnrollEntity, (e) => e.student)
  enrolls: EnrollEntity[];

  @OneToOne(() => AccountEntity)
  @JoinColumn({ name: 'email', referencedColumnName: 'username' })
  account: AccountEntity;
}
```

### Controllers

```typescript
@EntityController({
  name: 'courses',
  dto: CourseDto,
  entity: CourseEntity,
  accountTable: 'enrolls.student.account',
  operations: { read: 'owner', create: 'admin', update: 'admin', delete: 'admin' },
  relations: ['enrolls'],
})
class CourseController { ... }

@EntityController({
  name: 'enrolls',
  dto: EnrollDto,
  entity: EnrollEntity,
  accountTable: 'student.account',
  operations: { read: 'owner', create: 'owner', update: 'owner', delete: 'owner' },
  relations: ['course'],
})
class EnrollController { ... }
```

### What each user sees

**Alice** (account id=1, enrolled in Algebra + Programming):

```
GET /courses/find
→ [Algebra, Programming]                    ← filtered by enrollment bind

GET /courses/find?relations=[{"name":"enrolls"}]
→ [{ Algebra, enrolls: [Alice's] },
   { Programming, enrolls: [Alice's] }]     ← Bob's enroll auto-filtered out

GET /courses/find/2  (Physics — Alice not enrolled)
→ 404                                       ← access denied

POST /courses/create
→ 403                                       ← create is admin-only

DELETE /courses/remove/1
→ 403                                       ← delete is admin-only
```

**Admin** (superuser):

```
GET /courses/find
→ [Algebra, Physics, Programming]           ← all courses, no filtering

POST /courses/create  { title: "Chemistry" }
→ 201                                       ← admin bypass
```
