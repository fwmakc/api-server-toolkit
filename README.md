# api-server-toolkit

[![Tests](https://github.com/fwmakc/api-server-toolkit/actions/workflows/test.yml/badge.svg)](https://github.com/fwmakc/api-server-toolkit/actions/workflows/test.yml)
[![Version](https://img.shields.io/badge/version-v0.13.1-blue)](https://github.com/fwmakc/api-server-toolkit/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](https://github.com/fwmakc/api-server-toolkit/blob/master/LICENSE)

> Framework within a framework — CRUD engine, access control, column factories, and bootstrap helper for NestJS microservices.

## What This Is

A **working foundation** — not a demo, not a toy. Production-ready npm package
that auto-generates REST controllers with multi-layer access control, Swagger
docs, and TypeORM row-level security. Used by all services in the
[microservices stack](https://github.com/fwmakc/gateway-server).

Build your application on top of it — even a monolith that you split into
microservices later. Adopt incrementally, abandon incrementally.

## Framework Within a Framework

NestJS gives you the building blocks (DI, modules, routing). Toolkit gives you
the domain-specific patterns:

| Layer | NestJS provides | Toolkit adds |
|-------|----------------|--------------|
| **Controllers** | `@Controller`, `@Get`, `@Post` | `EntityController` — auto-generates 10 routes with access control, Swagger, bind scoping |
| **Access control** | `@UseGuards` (manual per route) | `operations: { read: 'public', create: 'owner' }` — declarative, data-driven |
| **TypeORM columns** | `@Column`, `@PrimaryColumn` | `@IdColumn`, `@BooleanColumn`, `@FieldAccess` — semantic, no boilerplate |
| **Startup** | Manual `app.listen()` + 15 lines of config | `bootstrap({ module, serviceName, cors: true })` — one call |
| **Relations** | Manual `leftJoin` per query | Batch-loader: one query per relation, N+1 → 2 queries |

**The key idea:** services depend on toolkit abstractions, not on specific
implementations. Swap the event bus transport, change the auth strategy,
replace the queue backend — service code stays the same.

## Limitations

This toolkit optimizes for a specific domain model. It is **not**:

- **RBAC system** — 6 access levels (`public`, `account`, `tenant`, `owner`, `superuser`, `closed`) are CRUD route presets, not a permissions matrix. You can layer RBAC on top with a custom guard — see [FAQ](#faq-addressing-common-concerns) below.
- **Multi-tenant ready** — optional tenant scoping via `TENANT_TABLE` env var. When set, a second WHERE dimension filters all queries by tenant. When empty (default), behavior is single-tenant. See [Multi-tenancy](#multi-tenancy) below.
- **Admin model** — the admin check is configurable via `SUPERUSER_FIELD` / `SUPERUSER_VALUE` env vars (default: `isSuperuser === true`). For complex RBAC (roles, permissions matrix), add your own guard.
- **Message broker** — no Kafka/Redis/NATS dependency. Events are published via HTTP by default. The `IEventClient` interface lets you plug in any broker — see [Event Publishing](#event-publishing) below.

If you need multi-tenancy or a fundamentally different access model, see
[Changing the Domain Model](#changing-the-domain-model) below — it lists the
exact files to fork and modify.

## Installation

```bash
npm install github:fwmakc/api-server-toolkit#v0.13.1
```

npm clones the repo and runs the `prepare` script automatically, which builds `dist/` via `tsc`. No manual build step needed. The package also ships `ai-declarations.md` (type declarations for AI-assisted development).

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
│  superuser → superuser required     │
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
│  superuser → strip if not superuser │
│  closed → always strip              │
└─────────────────────────────────────┘
    │
    ▼
  Response
```

---

## Access levels

Six independent restriction levels. Each CRUD operation gets its **own** level.

### The six levels

| Level | Authentication | Row scoping | Admin bypass |
|-------|---------------|-------------|------------------|
| `public` | Token **optional** | None | N/A |
| `account` | Token **required** (401) | None — sees all records | N/A |
| `tenant` | Token **required** (401) | `WHERE tenant = caller.tenantId` (when `TENANT_TABLE` set) | Yes — bypasses scoping |
| `owner` | Token **required** (401) | `WHERE ... = caller.id` (+ tenant when set) | Yes — bypasses scoping |
| `superuser` | Token **required** (401) | 403 if not superuser | N/A (only superuser passes) |
| `closed` | Route **not generated** | — | No one |

Admin check is configurable via `SUPERUSER_FIELD` / `SUPERUSER_VALUE` env vars (default: `isSuperuser === true`). See [FAQ](#faq-addressing-common-concerns).

### Access matrix — who can do what

| Level | Unauthenticated | Authenticated (not owner) | Record Owner | Admin |
|-------|:---:|:---:|:---:|:---:|
| `public` | 200 | 200 | 200 | 200 |
| `account` | 401 | 200 | 200 | 200 |
| `tenant` | 401 | 200 *(same tenant)* | 200 | 200 *(bypass)* |
| `owner` | 401 | 404 | 200 | 200 *(bypass)* |
| `superuser` | 401 | 403 | 403 | 200 |
| `closed` | 404 | 404 | 404 | 404 |

### Levels are NOT cumulative

These are **independent restriction modes**, not a hierarchy:

1. **`superuser` does NOT include `owner`** — the record owner gets 403 at `superuser` level
   unless they are also a superuser.
2. **`owner` does NOT include `account`** — a regular authenticated user gets 404 on
   someone else's record. Being authenticated grants nothing.
3. **The only overlap** — superuser bypass at the `owner` level: if
   `isSuperuser()` returns `true` (configurable via `SUPERUSER_FIELD`/`SUPERUSER_VALUE`),
   row scoping is skipped.

---

## Multi-tenancy

Optional tenant scoping via two env vars. When `TENANT_TABLE` is empty (default),
the system is single-tenant — zero overhead, no behavior change.

### Enable tenant scoping

```env
# .env
TENANT_TABLE=tenant          # relation path to tenant table
TENANT_FIELD=id              # field on tenant table to match (default: id)
```

When set, the `tenant` access level filters all queries by `WHERE tenant.id = :jwtTenantId`.
The `owner` level adds tenant filtering on top of owner filtering.

The JWT payload must include `tenantId`:

```typescript
// auth-server: include tenantId in JWT
const token = jwt.sign({
  id: userId,
  username: email,
  isSuperuser: false,
  tenantId: 5,           // ← required when TENANT_TABLE is set
});
```

### Tenant relation models

`TENANT_TABLE` is a **relation path** (supports multi-hop), not just a table name:

| Model | TENANT_TABLE | Schema requirement |
|-------|-------------|-------------------|
| Direct column | `tenant` | Every entity has `tenant_id` FK |
| Through account | `account.organization` | `account` has `organization_id` FK |
| Hierarchical | `team.department.org` | Existing relations, no new columns |
| Many-to-many | `tenant` | Auth-server handles M2M; toolkit reads `tenantId` from JWT |

Per-entity override:

```typescript
@EntityController({
  name: 'articles',
  operations: { read: 'tenant', create: 'tenant', update: 'owner', delete: 'superuser' },
  tenantTable: 'organization',  // overrides global TENANT_TABLE for this entity
})
```

### `account` vs `tenant` level

| Level | TENANT_TABLE not set | TENANT_TABLE set |
|-------|---------------------|------------------|
| `account` | Sees all records | Sees all records (**all tenants**) |
| `tenant` | Sees all records (same as account) | Sees records in **own tenant only** |
| `owner` | Sees own records | Sees own records **in own tenant** |

Use `account` for cross-tenant admin dashboards. Use `tenant` for regular user data.

### What's NOT covered (Phase 1)

- **Schema-per-tenant** (separate PostgreSQL schemas) — requires `SET search_path` per request
- **Database-per-tenant** (separate databases) — requires connection pool management

These are DB-level isolation strategies that can't be solved with WHERE clauses.
They're documented as future extensions.

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
  operations: { read: 'public', create: 'account', update: 'owner', delete: 'superuser' },
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
  operations: { read: 'superuser', create: 'superuser', update: 'superuser', delete: 'superuser' },
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
| `GET` | `/count` | read | Count matching records (supports `where`, `search`; ignores `limit`/`offset`) |
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
  operations: { read: 'owner', create: 'superuser', update: 'superuser', delete: 'superuser' },
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
- **Runs after `stripWriteFields`** — auto-assign overwrites any user-supplied value,
  so the caller cannot forge the ownership field.
- **Superuser skip:** when `bind.allow === true` (superuser), auto-assign is skipped.
  The superuser can set the ownership field from the DTO — but only if the developer
  explicitly allows it via `@FieldAccess({ write: 'superuser' })` on the bind-field.
  Without the decorator, the field defaults to `closed` and is stripped for everyone.

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
  @FieldAccess({ read: 'superuser', write: 'superuser' })
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
| `superuser` | Superuser only |
| `tenant` | Authenticated in same tenant |
| `closed` | No one (always stripped) |

| `write` level | Who can set/modify the field |
|---|---|
| `public` | Anyone via create/update (default) |
| `owner` | Owner-only (checked at service level) |
| `superuser` | Superuser only |
| `closed` | No one (always stripped) |

> **Bind-field exception:** the field matching `bind.name.split('.')[0]` (the
> ownership relation) defaults to `closed` when no `@FieldAccess` decorator is
> present — even for superusers. This prevents unauthorized ownership transfer.
> To allow it, decorate the field explicitly (e.g., `@FieldAccess({ write: 'superuser' })`).

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

- **Existing relation (has `id`):** ownership is verified via `checkOwnership()`.
  The caller must own the referenced entity (checked in batch via TypeORM `In()`).
  Only `{ id }` is kept — all other fields are stripped.

  ```json
  // Input: { "course": { "id": 1, "title": "Hacked" } }
  // After sanitize: { "course": { "id": 1 } }  — if caller owns course 1
  // After sanitize: {}                          — if caller does NOT own course 1
  ```

  **Exceptions:**
  - **Admin** (`bind.allow === true`): bypasses ownership check — all IDs accepted.
  - **Unregistered entities** (no `accountTable` in PermissionRegistry): treated as
    global, always allowed.
  - **Auto-assign relation** (field matching `bind.name.split('.')[0]`): skips
    ownership check — this is the ownership field itself (e.g., `account`).

- **New relation (no `id`):** checks `PermissionRegistry` for the related entity's
  `create` access level. If the caller doesn't have permission, the relation is
  removed entirely.

  ```json
  // If CourseEntity has create: 'superuser' and caller is not superuser:
  // Input: { "course": { "title": "New Course" } }
  // After sanitize: {} (relation stripped)
  ```

### `stripWriteFields`

Removes fields from the input DTO before saving, based on `@FieldAccess({ write })`
levels and the caller's permissions.

**Bind-field default `closed`:** the field matching `bind.name.split('.')[0]` (the
ownership relation) defaults to `closed` when no `@FieldAccess` decorator is present.
This prevents unauthorized ownership transfer via create/update — neither regular users
nor superusers can change the owner unless the developer explicitly allows it.

To enable ownership transfer, decorate the field:

```typescript
@FieldAccess({ write: 'superuser' })   // superuser-only transfer
account: AccountEntity;

@FieldAccess({ write: 'owner' })   // owner can transfer (e.g., to another account)
account: AccountEntity;
```

---

## Security scenarios

The following examples demonstrate how the framework prevents common attack vectors.
All examples use this entity:

```typescript
@Entity({ name: 'articles' })
class ArticleEntity extends BaseEntity {
  @IdColumn() id: number;
  @VarcharColumn('title') title: string;

  @ManyToOne(() => AccountEntity)
  @JoinColumn({ name: 'account_id' })
  account: AccountEntity;           // no @FieldAccess → defaults to 'closed' for writes

  @OneToMany(() => CommentEntity, (c) => c.article)
  comments: CommentEntity[];
}

// CommentEntity registered in PermissionRegistry with accountTable: 'account'
```

```typescript
@EntityController({
  name: 'articles',
  entity: ArticleEntity,
  accountTable: 'account',
  operations: { read: 'public', create: 'owner', update: 'owner', delete: 'owner' },
})
```

### 1. IDOR — Alice cannot associate with Bob's comment

Alice (account id=1) creates an article and tries to link Bob's comment (id=2):

```
POST /articles/create
{ "title": "Evil", "comments": [{ "id": 2 }] }

Step 1: stripWriteFields
  → 'account' matches bindField, no decorator → default 'closed' → stripped

Step 2: auto-assign (bind.id = 1, !bind.allow = true)
  → entity.account = { id: 1 }

Step 3: sanitizeForSave
  → checkOwnership([2]) → comment 2 belongs to Bob → stripped

Result: article created with Alice's account, comments array empty
```

### 2. Ownership transfer blocked (no decorator)

Alice updates her article, tries to transfer ownership to Bob:

```
PATCH /articles/update/1
{ "account": { "id": 2 } }

Step 1: stripWriteFields
  → 'account' matches bindField, no decorator → default 'closed'
  → canWrite('closed', bind) = false → STRIPPED

Step 2: 'account' absent from entity → TypeORM leaves account_id unchanged

Result: account_id stays 1 (Alice) ✓
```

### 3. Superuser transfer blocked (no decorator)

Even a superuser cannot transfer ownership without explicit decorator:

```
PATCH /articles/update/1  (superuser, bind.allow = true)
{ "account": { "id": 2 } }

Step 1: stripWriteFields
  → 'account' matches bindField, no decorator → default 'closed'
  → canWrite('closed', { allow: true }) = false → STRIPPED

Result: account_id stays 1 — 'closed' blocks everyone
```

### 4. Ownership transfer allowed with `@FieldAccess({ write: 'superuser' })`

```typescript
@FieldAccess({ write: 'superuser' })
@ManyToOne(() => AccountEntity)
account: AccountEntity;
```

```
PATCH /articles/update/1  (superuser, bind.allow = true)
{ "account": { "id": 2 } }

Step 1: stripWriteFields
  → writeLevel = 'superuser' → canWrite('superuser', { allow: true }) = true → NOT stripped

Step 2: sanitizeForSave
  → isAutoAssignRelation = true → skips ownership check → keeps { id: 2 }

Step 3: save → account_id = 2

Result: ownership transferred to Bob ✓
```

### 5. Superuser creates article for another user

With `create: 'owner'` + `@FieldAccess({ write: 'superuser' })`, superuser can set the owner
explicitly (auto-assign is skipped for superuser):

```
POST /articles/create  (superuser, create: 'owner', bind.allow = true)
{ "title": "For Bob", "account": { "id": 2 } }

Step 1: stripWriteFields
  → writeLevel = 'superuser' → canWrite('superuser', { allow: true }) = true → NOT stripped

Step 2: auto-assign → SKIPPED (bind.allow = true)
  → account from DTO preserved: { id: 2 }

Step 3: sanitizeForSave
  → isAutoAssignRelation = true → skips ownership check → keeps { id: 2 }

Step 4: save → article with account_id = 2

Result: superuser creates article owned by Bob ✓
```

---

## Guards & Decorators

| Export | Description |
|--------|-------------|
| `@Account()` | Applies JWT `AuthGuard` — throws 401 if no valid token |
| `@Account('noBlock')` | Applies JWT guard but **does not throw** if no token (user is `undefined`) |
| `@Self()` | Param decorator — extracts `request.user` (requires `@Account()` guard to populate it) |
| `@Secure` | `@UseGuards(SecureGuard)` — token-based access |
| `@SimpleSecure` | `@UseGuards(SimpleSecureGuard)` — lightweight token check |
| `@Data()` | Param decorator — merges `request.query` + `request.body`, JSON-parses strings |
| `@FieldAccess({ read, write })` | Property decorator — field-level access control on entity columns |
| `@SoftDelete()` | Property decorator — marks a Date column for soft delete. `remove()` becomes soft, `hardDelete()` + `restore()` routes generated |
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

---

## HTTP Helper

Native `fetch` wrapper with timeout, JSON serialization, and typed responses. **Replaces axios** in all service-to-service and external HTTP calls.

### `httpPost(url, body?, options?)`

```typescript
import { httpPost } from 'api-server-toolkit';

const { status, data, ok } = await httpPost(
  'http://event-server:3005/events',
  { pattern: 'user.registered', payload: { ... } },
  {
    headers: { 'X-Internal-Api-Key': 'secret' },
    timeout: 5000,
  },
);
```

### `httpGet(url, options?)`

```typescript
import { httpGet } from 'api-server-toolkit';

const { data } = await httpGet('http://auth-server:3001/.well-known/jwks.json');
```

### `raw` option — don't throw on non-2xx

By default, non-2xx responses throw `HttpError`. Use `raw: true` to get the response without throwing:

```typescript
const { status, data, ok } = await httpPost(url, body, { raw: true });
if (!ok) { /* handle non-2xx */ }
```

### Subpath import (no passport dependency)

Services that don't use auth guards (e.g., event-server, message-server) should import from the subpath to avoid pulling in `@nestjs/passport`:

```typescript
import { httpPost, httpGet } from 'api-server-toolkit/helper';
```

### Types

| Type | Description |
|------|-------------|
| `HttpResponse<T>` | `{ status: number; data: T; ok: boolean }` |
| `HttpOptions` | `{ headers?: Record<string, string>; timeout?: number; raw?: boolean }` |
| `HttpError` | `extends Error` — thrown on non-2xx when `raw` is not set |

---

## AI Context Generation

The toolkit ships two tools for AI-assisted development:

### 1. Type Declarations (`ai-declarations.md`)

Raw `.d.ts` declarations for every toolkit export. Generated from `dist/` and shipped inside the npm package.

```bash
# In the toolkit repo:
npm run ai-declarations    # → ai-declarations.md
```

Consumer services get this file automatically via `node_modules/api-server-toolkit/ai-declarations.md`.

### 2. Service Context (`ai-context.md`)

Scans the consumer service's `./src/` directory — controllers, routes, services, entities, DTOs — and generates a structured markdown reference.

Add to your service's `package.json`:

```json
"scripts": {
  "ai-context": "node node_modules/api-server-toolkit/scripts/generate-service-context.js"
}
```

Then run:

```bash
npm run ai-context    # → ./ai-context.md
```

**What it scans:**

| Pattern | Extracted |
|---------|-----------|
| `**/*.controller.ts` | Class name, `@Controller` base path, `@Get`/`@Post`/etc routes, `@ApiTags` |
| `**/*.service.ts` | Class name, parent class, public methods with parameters and return types |
| `**/*.entity.ts` | Class name, `@Entity` table name, columns, relations |
| `**/*.dto.ts` | Class name, fields with types |

Skips: `node_modules/`, `dist/`, `tests/`, `*.spec.ts`, `*.test.ts`

---

## AuthClientModule

JWT validation + account info cache for any service that needs to verify tokens
issued by auth-server.

### Import

```typescript
import { AuthClientModule } from 'api-server-toolkit/auth-client';

@Module({
  imports: [AuthClientModule.forRoot()],
})
export class AppModule {}
```

`AuthClientModule.forRoot()` provides:
- **AccountStrategy** — passport-jwt strategy validating tokens via JWKS
- **AuthClientService** — fetches + caches account info from auth-server
- **PassportModule** — registered with session: false

### How it works

```
Request → Bearer token
  → passport-jwt verifies signature (JWKS public key, cached)
  → passport-jwt checks exp claim (if present)
  → AccountStrategy.validate()
    → AuthClientService.getAccountInfo(id)
      → cache hit? → return cached
      → cache miss? → HTTP GET auth-server /account/internal/info/:id
        → reads Cache-Control: max-age=N from response header
        → caches for N seconds (or fallback TTL)
```

### TTL priority

Account info cache TTL is determined by:

| Priority | Source | Example |
|----------|--------|---------|
| 1 | auth-server `Cache-Control: max-age=N` header | `max-age=30` → 30s |
| 2 | `AUTH_CACHE_TTL` env var on consumer (ms) | `30000` → 30s |
| 3 | Default | 30000ms (30s) |

auth-server controls TTL via `INTERNAL_INFO_CACHE_TTL` env var (seconds).
Consumer can set `AUTH_CACHE_TTL` as fallback when header is missing.

### Env vars

| Variable | Side | Default | Description |
|----------|------|---------|-------------|
| `AUTH_SERVER_URL` | Consumer | `http://localhost:3001` | Auth-server base URL |
| `INTERNAL_API_KEY` | Consumer | — | Shared secret for internal calls |
| `AUTH_CACHE_TTL` | Consumer | 30000 | Fallback cache TTL in ms |
| `INTERNAL_INFO_CACHE_TTL` | Auth-server | 30 | Cache-Control max-age in seconds |

### Peer dependencies

`passport-jwt` and `jwks-rsa` are required only when importing `auth-client`.
Services that don't validate JWT (e.g. event-server) don't need them.

```bash
npm install passport-jwt jwks-rsa
```

---

## Event Publishing

The toolkit provides `IEventClient` — a transport-agnostic interface for publishing events.
The default implementation (`HttpEventClient`) POSTs to event-server via HTTP.

```typescript
import { IEventClient } from 'api-server-toolkit';

constructor(private readonly eventClient: IEventClient) {}

async onRegister(user: User) {
  await this.eventClient.publish('user.registered', {
    userId: user.id,
    username: user.username,
    email: user.email,
  });
}
```

### Replacing the transport

The toolkit does NOT hardcode a message broker. `IEventClient` is a single-method abstract class:

```typescript
export abstract class IEventClient {
  abstract publish(
    pattern: string,
    payload: Record<string, any>,
    options?: PublishOptions,
  ): Promise<void>;
}
```

To use Redis Streams, NATS, Kafka, or RabbitMQ instead of HTTP — implement the interface
and override the DI binding in your `AppModule`:

```typescript
// redis-event-client.ts — your service, your dependency
import { Injectable } from '@nestjs/common';
import { IEventClient, PublishOptions } from 'api-server-toolkit';
import Redis from 'ioredis';

@Injectable()
export class RedisEventClient extends IEventClient {
  private redis: Redis;

  async publish(pattern: string, payload: Record<string, any>, options?: PublishOptions): Promise<void> {
    await this.redis.xadd(
      'events',
      '*',
      'pattern', pattern,
      'payload', JSON.stringify(payload),
      'source', options?.source || '',
      'priority', options?.priority || 'normal',
    );
  }
}

// app.module.ts
import { EventClientModule } from 'api-server-toolkit/client';

@Module({
  imports: [
    // Import EventClientModule for the IEventClient token, then override
    EventClientModule,
  ],
  providers: [
    RedisEventClient,
    { provide: IEventClient, useExisting: RedisEventClient },
  ],
})
export class AppModule {}
```

On the event-server side, add a consumer that reads from your message queue and calls
`EventsService.publish()` — the existing ingestion, delivery, circuit breaker, and retry
machinery stays untouched.

### Why not ship Redis/NATS support built-in?

Every project has different infrastructure. Hardcoding a broker adds a dependency and
opinion to the toolkit. The abstraction (`IEventClient`) is the value — it lets you
plug in any transport with ~20 lines of code. The HTTP default works out of the box
with zero external dependencies.

---

## CommonService

Generic CRUD service backing the generated controller.

```typescript
class PostService extends CommonService<PostDto, PostEntity> {
  constructor(
    @InjectRepository(PostEntity)
    protected readonly repository: Repository<PostEntity>,
  ) {
    super();
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
| `count(findDto, bind?)` | Count matching records (DB-side `COUNT(*)`) |
| `create(dto, relations?, bind?, manager?)` | Create with nested relations |
| `update(id, dto, relations?, bind?, manager?)` | Update by ID |
| `upsert(dto, relations?, bind?)` | Create or update by unique columns (race-safe) |
| `remove(id, bind?, manager?)` | Smart delete — soft if `@SoftDelete()`, hard otherwise |
| `hardDelete(id, bind?, manager?)` | Force physical delete (ignores `@SoftDelete()`) |
| `restore(id, bind?)` | Undo soft delete (requires `@SoftDelete()`) |
| `sortPosition(field, findDto, bind?)` | Re-sort all records by field |
| `movePosition(id, field, position?, bind?)` | Move record to specific position |

All write methods (`create`, `update`, `remove`, `hardDelete`) accept an optional
`manager?: EntityManager` parameter for transaction support:

```typescript
await dataSource.transaction(async (manager) => {
  await orderService.create(orderDto, [], bind, manager);
  await invoiceService.create(invoiceDto, [], bind, manager);
});
```

The `bind` parameter controls row scoping. When omitted, defaults to `{ allow: true }`
(no scoping).

### Error handling

Database errors are mapped to appropriate HTTP status codes via `throwDbError()`:

| PostgreSQL code | HTTP status | Example |
|----------------|-------------|---------|
| `23505` unique_violation | 409 Conflict | Duplicate email |
| `23503` foreign_key_violation | 409 Conflict | Invalid FK reference |
| `23502` not_null_violation | 400 Bad Request | Missing required field |
| `08006` connection_failure | 503 Service Unavailable | DB unreachable |
| `40001` serialization_failure | 503 Service Unavailable | Deadlock |
| `40P01` deadlock_detected | 503 Service Unavailable | Deadlock |
| Other | 500 Internal Server Error | |

Schema details (table/column names) are never leaked to the client.
Full error details are logged server-side via `Logger`.

---

## Soft Delete

Optional soft delete via `@SoftDelete()` decorator. When present on an entity column,
`remove()` automatically performs soft delete instead of hard delete.

### Setup

```typescript
@Entity('articles')
class ArticleEntity extends CommonColumn {
  @IdColumn() id: number;

  @SoftDelete()       // ← marks this column for soft delete
  @DateColumn()
  deletedAt: Date;
}
```

### Behavior

| Operation | Without `@SoftDelete()` | With `@SoftDelete()` |
|-----------|------------------------|---------------------|
| `remove(id)` | `DELETE FROM` | `UPDATE SET deletedAt = now()` |
| `hardDelete(id)` | (route not generated) | `DELETE FROM` — force physical delete |
| `restore(id)` | (route not generated) | `UPDATE SET deletedAt = NULL` |
| `find()` | Normal | Auto-filters `WHERE deletedAt IS NULL` |

### Generated routes

When `@SoftDelete()` is present, EntityController generates two additional routes
alongside the standard `DELETE /remove/:id`:

| Route | Method | Description |
|-------|--------|-------------|
| `DELETE /remove/:id` | `remove()` | Smart — soft delete |
| `DELETE /hard-delete/:id` | `hardDelete()` | Force physical delete |
| `PATCH /restore/:id` | `restore()` | Undo soft delete |

All three are controlled by the `delete` access level.

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
| `BooleanColumn()` | `smallint` | True/false (stored as 0/1) |
| `IntColumn()` | `int` | Integer |
| `SmallIntColumn()` | `smallint` | Small integer |
| `BigIntColumn()` | `bigint` | Big integer |
| `FloatColumn()` | `float` | Floating point |
| `DateColumn()` | `timestamp` | Optional timestamp (nullable, no auto-fill — use for dates like birthday, deleted_at) |
| `EnumColumn()` | `enum` | Enum value |
| `JsonColumn()` | `json` | JSON object/array |

### Sorting

| Factory | Type | Description |
|---------|------|-------------|
| `PositionAscColumn()` | `int` | Ascending sort position |
| `PositionDescColumn()` | `int` | Descending sort position |

### DTO Decorators

Swagger documentation and validation decorators for DTO classes (not entity columns):

| Factory | Description |
|---------|-------------|
| `DtoColumn(description?, options?)` | `@ApiProperty` with description, required, default |
| `DtoCreatedColumn()` | `@ApiProperty` for auto-set created timestamp |
| `DtoUpdatedColumn()` | `@ApiProperty` for auto-set updated timestamp |
| `DtoEnumColumn(description, enum, default?, options?)` | `@ApiProperty` + `@IsEnum` validation |
| `DtoJsonColumn(description, options?)` | `@ApiProperty` + `@IsJSON` + `@IsOptional` validation |

### Indexed

| Factory | Description |
|---------|-------------|
| `IndexedColumn('unique')` | Adds a database index (pass `'unique'` for unique index, omit for plain index) |

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
  create: 'superuser',
  read: 'owner',
  update: 'superuser',
  delete: 'superuser',
  accountTable: 'enrolls.student.account',
  accountField: 'id',
});

PermissionRegistry.set(EnrollEntity, {
  create: 'owner',
  read: 'owner',
  update: 'owner',
  delete: 'owner',
  accountTable: 'student.account',
  accountField: 'id',
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
// { create: 'superuser', read: 'owner', update: 'superuser', delete: 'superuser',
//   accountTable: 'enrolls.student.account', accountField: 'id' }
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
  operations: { read: 'owner', create: 'superuser', update: 'superuser', delete: 'superuser' },
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
→ 403                                       ← create is superuser-only

DELETE /courses/remove/1
→ 403                                       ← delete is superuser-only
```

**Admin** (superuser):

```
GET /courses/find
→ [Algebra, Physics, Programming]           ← all courses, no filtering

POST /courses/create  { title: "Chemistry" }
→ 201                                       ← superuser bypass
```

---

The toolkit is designed to be adopted incrementally and abandoned incrementally.

## Backend-Only — Build Your Application

The toolkit is a backend library. No frontend, no UI, no client SDK generator.

It gives you the tools to build a production-ready REST API: entities with
access control, auto-generated Swagger docs, guards, inter-service communication,
and a startup function. You bring the domain logic and the frontend.

Use it with any frontend framework: React, Vue, Next.js, mobile — anything
that speaks HTTP. The generated Swagger/OpenAPI spec works with code generators
(openapi-generator, Orval, swagger-codegen) if you want a typed client.

## Build a Monolith, Split Into Microservices

The toolkit works standalone. Start with one service (like api-server), add entities, wire
up `EntityController`. When you're ready to split:

1. **Extract auth** → auth-server (JWT RS256, social login, password reset)
2. **Extract events** → event-server (webhook pub/sub)
3. **Extract files** → file-server (upload, image processing)
4. **Extract email** → message-server (queued, retry, templates)

Each extraction is additive — the original service keeps working. The toolkit provides the
shared CRUD engine, guards, and columns that all services use.

## Migration to plain TypeORM

When you outgrow the toolkit's `EntityController`:

1. Replace `EntityController` with your own controllers (keep `CommonService`)
2. Replace column factories with native TypeORM `@Column()` decorators
3. Keep guards (`InternalAuthGuard`, `SecureGuard`) — they work independently
4. Keep `httpPost`/`httpGet` helpers — they have no NestJS dependencies

The toolkit is designed to be adopted incrementally and abandoned incrementally.

## Migrating from Legacy

### Scenario: you have an existing PostgreSQL database and want to adopt the toolkit

The toolkit uses standard TypeORM entities — no magic schema. You can connect
to an existing database and map your tables to toolkit entities.

### Step 1: Connect to existing database

```typescript
// app.module.ts — point to your existing database
TypeOrmModule.forRoot({
  type: 'postgres',
  host: 'your-existing-db',
  database: 'your_legacy_db',
  entities: [YourEntity],  // toolkit entities mapped to existing tables
  synchronize: false,      // ← CRITICAL: don't auto-create schema
  migrations: ['dist/migrations/*{.ts,.js}'],
})
```

### Step 2: Map existing tables to toolkit entities

Existing table:
```sql
CREATE TABLE myapp_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created TIMESTAMP DEFAULT now()
);
```

Toolkit entity (maps to the same table):
```typescript
@Entity('myapp_users')  // ← existing table name
export class UserEntity extends CommonColumn {
  @IdColumn() id: number;
  @VarcharColumn() email: string;
  @VarcharColumn('password_hash') password: string;  // ← existing column name
  @BooleanColumn('is_active') isActivated: boolean;   // ← alias mapping
}
```

**Key rules:**
- `@Entity('existing_table_name')` — use the existing table name
- Column decorators accept a custom column name: `@VarcharColumn('legacy_name')`
- `synchronize: false` — never let TypeORM modify existing schema
- You don't need to use all toolkit columns — just the ones you need

### Step 3: Gradual endpoint migration

Run old and new in parallel:

```
nginx
  ├── /api/v1/legacy-users → old server (existing code)
  └── /api/v2/users        → new toolkit service (EntityController)
```

Migrate endpoints one at a time. When all traffic moves to v2, decommission v1.

### Step 4: Auth integration

**If your legacy system uses JWT:** configure toolkit's `AccountStrategy` to
validate your existing tokens. Point `JWT_PUBLIC_KEY_PATH` to your existing
public key.

**If your legacy system uses sessions:** use the toolkit's auth-server to issue
new JWTs alongside existing sessions. Migrate endpoints gradually.

**If you want to replace auth entirely:** use the toolkit's auth-server. It
issues JWTs that all services can validate via JWKS.

### What NOT to do

- **Don't run `synchronize: true`** on an existing database — TypeORM may drop/recreate columns
- **Don't rename existing columns** — use TypeORM's `@Column({ name: 'legacy_name' })` or the toolkit's `@VarcharColumn('legacy_name')` to alias
- **Don't migrate all endpoints at once** — do it one controller at a time
- **Don't forget foreign keys** — if your legacy tables have FK constraints, TypeORM needs `@ManyToOne`/`@OneToMany` relations defined to match

## Changing the Domain Model

The toolkit's access-control layer assumes a specific identity model:

- **`account`** — the default relation name linking entities to their owner (configurable via `OWNER_TABLE`)
- **`isSuperuser`** — the admin-bypass check (configurable via `SUPERUSER_FIELD` / `SUPERUSER_VALUE`)
- **`'jwt'`** — the hardcoded Passport strategy name
- **`AccessLevel`** — a fixed enum: `'public' | 'account' | 'tenant' | 'owner' | 'superuser' | 'closed'`

This is fine if your project uses the same model (the fwmakc stack does). If your
domain is different, here's what you can change and how.

### Scenario 1: Different table name (no fork needed)

Your users live in a `users` table instead of `accounts`.

**Option A — global env var (one line, no code):**

```env
OWNER_TABLE=user
```

All ownership queries, bind scoping, `/self` routes, and field security now use
`user` as the relation name. No per-controller configuration needed.

**Option B — per-controller override:**

```typescript
@EntityController({
  name: 'posts',
  dto: PostDto,
  entity: PostEntity,
  accountTable: 'user',    // overrides OWNER_TABLE for this controller
  accountField: 'id',      // PK field on the owner (default: 'id')
})
```

**What stays unchanged:**

- The `AccessLevel` string `'account'` (meaning "any authenticated user") — it's a
  label, not a table reference

### Scenario 2: Different admin model

You want role-based admin (`role: 'admin'`) instead of `isSuperuser: true`.

**Option A — env vars (no fork, no code changes):**

The toolkit reads `SUPERUSER_FIELD` and `SUPERUSER_VALUE` from the environment:

```env
# Default: checks isSuperuser === true
SUPERUSER_FIELD=isSuperuser
SUPERUSER_VALUE=true

# Custom: checks role === admin
SUPERUSER_FIELD=role
SUPERUSER_VALUE=admin

# Multiple values: checks role IN (admin, superadmin)
SUPERUSER_FIELD=role
SUPERUSER_VALUE=admin,superadmin
```

All three admin checks (guard, owner bypass, field access) use this configuration.

**Option B — JWT mapping (no fork):**

Map your roles in your Passport JWT strategy so the toolkit sees the shape
it expects:

```typescript
// In your service's JWT strategy (e.g. JwtStrategy.validate):
validate(payload: any) {
  return {
    id: payload.sub,
    username: payload.email,
    isSuperuser: payload.roles?.includes('admin') ?? false,
  };
}
```

**Option C — add a custom guard (no fork):**

The 6 access levels are CRUD route presets. For fine-grained RBAC, add your
own guard on top of EntityController:

```typescript
@EntityController({
  name: 'posts',
  dto: PostDto,
  entity: PostEntity,
  operations: { read: 'public', create: 'account' },
})
@UseGuards(RbacGuard) // your guard checks permissions matrix
export class PostsController {}
```

The toolkit's access level check runs first (is the user authenticated?),
then your `RbacGuard` checks fine-grained permissions. Both coexist without
conflict.

**Fork required if:** You need to change the 6-level enum itself, or add
multi-tenancy (`tenant_id` scoping). See Scenario 3 below.

### Scenario 3: Completely custom identity model (fork required)

You want a fundamentally different model: multi-tenant with `tenant_id`,
OAuth-only with no local users, or a permission matrix instead of access levels.

This touches the core access-control layer. Here's every file that encodes
domain assumptions:

| File | Symbol | Coupling |
|------|--------|----------|
| `src/common/access.type.ts` | `AccessLevel` type | Fixed set of 6 levels, includes `'account'` and `'superuser'` |
| `src/common/access.type.ts` | `AccountLike` interface | Assumes `id`, `username`, `isActivated`, `isSuperuser` |
| `src/common/auth.decorator.ts` | `AuthGuard('jwt')` | Passport strategy name `'jwt'` hardcoded in 4 guard classes |
| `src/common/auth.decorator.ts` | `JwtAdminGuard` | Checks `isSuperuser(user)` |
| `src/common/auth.decorator.ts` | `@Self()` | Casts `request.user` to `AccountLike` |
| `src/common/service/bind.service.ts` | `bind()` | Default relation name: `OWNER_TABLE` |
| `src/common/entity.controller.ts` | `resolveBind()` | Owner queries bypassed if `isSuperuser(account)` |
| `src/common/entity.controller.ts` | `self()` | Uses `accountTable \|\| OWNER_TABLE` |
| `src/common/common.service.ts` | `resolveBindRelationId()` | Resolves bind path to relation ID |
| `src/common/common.service.ts` | `resolveAutoAssign()` | Auto-assigns owner FK on create |
| `src/common/common.service.ts` | `sortPosition()` | Uses bind for reset scope |
| `src/common/common.service.ts` | `create()` | Silently sets `entity[ownerTable] = { id: callerId }` |
| `src/common/interceptor/remove-private.interceptor.ts` | `RemovePrivateFieldsInterceptor` | Reconstructs bind from `request.user` |
| `src/common/service/private_fields.service.ts` | `canRead()` | Owner-field resolution: `name = OWNER_TABLE` default |
| `src/common/service/private_fields.service.ts` | `stripWriteFields()` | Prevents writing the owner FK field |
| `src/common/service/sanitize.service.ts` | `checkOwnership()` | Validates ownership of nested relations via registry |
| `src/common/service/nested_filter.service.ts` | `filterNestedRelations()` | Filters nested relations by ownership |
| `src/common/permission.registry.ts` | `PermissionRegistry` | `getAccountTable` / `getAccountField` accessors |

**What's domain-neutral (no changes needed):**

- All column decorators (`IdColumn`, `VarcharColumn`, etc.)
- `CommonService` query helpers (`parseWhereObject`, `buildSearchWhere`, etc.)
- Queue system (`QueueJobEntity`, `QueueWorker`, `QueueService`)
- `HealthModule`, `bootstrap()`
- `httpPost` / `httpGet` helpers
- `InternalAuthGuard` (shared-secret, no identity model)
- Legacy `SecureGuard` / `SimpleSecureGuard` (HMAC token, no identity extraction)

### Checklist: fork and adapt

If you decide to fork the toolkit for a custom domain model:

1. Copy the repo, change the package name
2. Set `OWNER_TABLE` env var — no code changes needed for table name
3. Set `SUPERUSER_FIELD`/`SUPERUSER_VALUE` env vars — no code changes for admin check
4. Update `AccessLevel` in `access.type.ts` — add/remove levels (only if you need different levels)
5. Update `AccountLike` in `access.type.ts` — match your JWT payload shape
6. If using a different Passport strategy name, update `auth.decorator.ts`
7. Run the test suite (`npm test`) — it will catch missed references
8. Pin your fork: `"api-server-toolkit": "github:yourorg/your-toolkit-fork#v1.0.0"`

## FAQ: Addressing Common Concerns

### "Only `isSuperuser` for admin — what if I need roles?"

Set `SUPERUSER_FIELD` and `SUPERUSER_VALUE` env vars. The toolkit checks any JWT field
against any value(s) — no code changes:

```env
SUPERUSER_FIELD=role
SUPERUSER_VALUE=admin,superadmin
```

For fine-grained RBAC (permissions matrix like `canEditPosts`), add a custom
`@UseGuards(RbacGuard)` alongside `@EntityController`. The 6 access levels are
CRUD route presets (think Express middleware), not a security model. Your guard
handles authorization logic; the toolkit handles route generation, Swagger, and
bind scoping.

### "5 fixed access levels — too rigid?"

The levels (`public`, `account`, `owner`, `superuser`, `closed`) control which CRUD
routes exist and who can call them. They are presets, not constraints. You can:

- Set any operation to `'closed'` and implement the route yourself
- Add `@UseGuards(YourGuard)` on top for additional checks
- Fork to change the enum itself (see [Changing the Domain Model](#changing-the-domain-model))

### "Single maintainer, no community — what about support?"

This is a **fork-first** codebase. You own the code from day one — no SaaS
dependency, no API key to revoke, no service to shut down. The toolkit ships
with 125 unit tests and full type declarations (`ai-declarations.md`). You inherit a
tested foundation, not a black box.

Forking is the standard enterprise pattern (cf. internal Spring Boot forks,
Keycloak forks, Django forks). Pin your fork: `"api-server-toolkit":
"github:yourorg/your-toolkit-fork#v1.0.0"`.

### "Microservices overhead — too complex for a startup?"

The toolkit works in a monolith too. Use `EntityController` + `CommonService`
in a single NestJS app — no gateway, no event-server, no Docker Compose needed.
Split into microservices when traffic demands it, not before.

The microservices stack (gateway, event bus, separate servers) is a reference
architecture showing how to structure services when you need them. It's not a
requirement for using the toolkit.

### "B2B SaaS with multi-tenancy — easier to build from scratch?"

No. The toolkit gives you CRUD generation, Swagger docs, batch-loaded relations,
and field-level security — tested and documented. A multi-tenancy fork touches
5-7 files (listed in [Scenario 3](#scenario-3-completely-custom-identity-model-fork-required)).
You build the tenant layer; you inherit the infrastructure.

Starting from scratch means rebuilding all of that plus the tenant layer.
Forking the toolkit means adding only the tenant layer (`tenant_id` scoping,
auto-assignment, query filtering) — a day of work, not weeks.

## Related Services

The toolkit is the foundation for the entire microservices stack:

| Service | Uses toolkit for | Repo |
|---------|------------------|------|
| api-server | EntityController, CommonService, columns, access control | [fwmakc/api-server](https://github.com/fwmakc/api-server) |
| auth-server | Guards, columns, bootstrap, HealthModule | [fwmakc/auth-server](https://github.com/fwmakc/auth-server) |
| event-server | InternalAuthGuard, httpPost, HealthModule, bootstrap | [fwmakc/event-server](https://github.com/fwmakc/event-server) |
| message-server | Queue system, guards, HealthModule, bootstrap | [fwmakc/message-server](https://github.com/fwmakc/message-server) |
| file-server | Guards, HealthModule, bootstrap | [fwmakc/file-server](https://github.com/fwmakc/file-server) |
| scaffold | bootstrap, HealthModule (minimal template) | [fwmakc/scaffold](https://github.com/fwmakc/scaffold) |
| gateway-server | Orchestration only (no toolkit dependency) | [fwmakc/gateway-server](https://github.com/fwmakc/gateway-server) |

---

## Versioning

All services in the fwmakc stack share the same **major version**. Same major = guaranteed compatibility.

| Level | Scope | Example |
|-------|-------|---------|
| **Major** | Shared across ALL services. A breaking change in any service bumps the major for everyone. | toolkit 2.x → 3.0.0 ⟹ all services tag v3.0.0 |
| **Minor** | Independent per service. New features (additive). | auth-server 2.1.0 → 2.2.0 |
| **Patch** | Independent per service. Bug fixes. | event-server 2.0.0 → 2.0.1 |

### What triggers a major bump

A breaking change at any intersection point:

- **api-server-toolkit** — guards, columns, decorators, EntityController, bootstrap, services
- **event-server contracts** — DTO field removed/renamed, required field added
- **Inter-service API** — JWT claim format, `X-Internal-Api-Key` scheme, webhook contract
- **Public API** — any endpoint that another service depends on

### What does NOT trigger a major bump

- Bug fixes, performance improvements
- New features (additive — new optional fields, new endpoints)
- Internal refactoring that doesn't change interfaces

### Alignment process

When a service makes a breaking change (e.g., toolkit 2.x → 3.0.0):

1. The changing service bumps its major and tags the release
2. **All other services** get a stack alignment commit:
   - Bump `version` in `package.json`
   - Add CHANGELOG entry: `chore: stack v3 alignment`
   - Update dependency pins if needed
   - Tag `v3.0.0`
3. All services are now on stack v3

### Current versions

| Service | Version |
|---------|---------|
| [api-server-toolkit](https://github.com/fwmakc/api-server-toolkit) | v2.1.0 |
| [event-server](https://github.com/fwmakc/event-server) | v2.0.0 |
| [auth-server](https://github.com/fwmakc/auth-server) | v2.0.0 |
| [message-server](https://github.com/fwmakc/message-server) | v2.0.0 |
| [file-server](https://github.com/fwmakc/file-server) | v2.0.0 |
| [chat-server](https://github.com/fwmakc/chat-server) | v2.0.0 |
| [api-server](https://github.com/fwmakc/api-server) | v2.0.0 |
| [gateway-server](https://github.com/fwmakc/gateway-server) | v2.0.0 |
| [scaffold](https://github.com/fwmakc/scaffold) | v2.0.0 |
