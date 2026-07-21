# Plan: Multi-hop bindPath + relations — full implementation

## Context

Enrollment-based access control via `accountTable: 'enrolls.student.account'` works for
basic read filtering (24 tests pass). But the interaction between multi-hop bindPath
(access control) and relations (data shaping) has gaps in security and correctness.

All changes in `shared/src/common/`. Tests in `api-server/src/tests/cases/`.

---

## Security philosophy: deny by default

Three of four layers default to closed. Developer must explicitly open access.

| Layer | Default | Principle |
|-------|---------|-----------|
| **Operations** | `closed` | No config → no routes generated (404) |
| **Relations** | `deny all` | No whitelist → no nested data loaded |
| **Nested filtering** | automatic | Entity in Registry → filtered everywhere |
| **Fields** | `public` | No `@FieldAccess` → visible (dev hides sensitive) |

**Safe failure mode:** developer forgets to configure → nothing works, nothing leaks.
**Unsafe failure mode (old):** developer forgets → everything public, silent leak.

---

## Task 1: Relations whitelist on EntityController (deny by default)

**Problem:** Client can request any relation by name (`enrolls.student`,
`enrolls.student.account`) and TypeORM loads it. Data leak — Alice can see Bob's
student data, account info, etc. on shared courses.

**Solution:** Add `relations?: string[]` to `EntityControllerOptions`:

```typescript
@EntityController({
    // ...
    relations: ['enrolls'],  // only enrolls; enrolls.student is blocked
})
```

**Filtering logic:** In controller methods, before passing to service:
- Requested relation path must EXACTLY match an entry in whitelist
- If relation not in whitelist → **strip** (silently remove, process valid part)
- If `relations` not specified on controller → **deny all** (no relations loaded)

**Files:** `access.type.ts`, `entity.controller.ts`

---

## Task 2: Operations deny-by-default

**Problem:** `entity.controller.ts:78-81` — operations default to `'public'`:

```typescript
const readAccess = options.operations?.read ?? 'public';
const createAccess = options.operations?.create ?? 'public';
// ...
```

Developer creates controller, forgets `operations` → all CRUD routes are public.

**Solution:** Change defaults to `'closed'`:

```typescript
const readAccess = options.operations?.read ?? 'closed';
const createAccess = options.operations?.create ?? 'closed';
const updateAccess = options.operations?.update ?? 'closed';
const deleteAccess = options.operations?.delete ?? 'closed';
```

If `operations` not specified → all routes closed (404). Developer must explicitly
open each operation.

**Files:** `entity.controller.ts`

---

## Task 3: Multi-hop auto-assign for create

**Problem:** `common.service.ts:215` — guard `!relationName.includes('.')` skips
multi-hop bind during create. Creating an enrollment with `accountTable:
'student.account'` doesn't auto-link the student.

**Current single-hop behavior (works):**
```
bind = { id: 1, name: 'account', key: 'id' }
→ dto.account = { id: 1 }    // auto-assigned
```

**Desired multi-hop behavior:**
```
bind = { id: 1, name: 'student.account', key: 'id' }

1. Query builder joins the chain:
   SELECT students.id FROM students
     JOIN accounts ON students.email = accounts.username
     WHERE accounts.id = 1
   → student.id = 1

2. dto.student = { id: 1 }    // auto-assigned
```

**Rules:**
- First segment must be a ToOne relation (ManyToOne/OneToOne). If ToMany (OneToMany/
  ManyToMany) — skip auto-assign (doesn't make sense for collections).
- If intermediate entity not found → `throw NotFoundException`.
- upsert() calls create() internally — affected too.

**Files:** `common.service.ts` (rewrite `resolveBindRelationId`)

---

## Task 4: Dedup behavior (RESOLVED — no changes needed)

Deduplication stays. The root entity determines dedup behavior:

- **Root = course** (bindPath `enrolls.student.account`): JOIN produces duplicate
  course rows when multiple enrollments match. Dedup by `item.id` — return one course.
  The `enrolls` relation array contains all enrollments for that course.
- **Root = enroll** (bindPath `student.account`): each enroll is unique, no duplicates.
  If `course` is loaded as relation, the same course appears in each enroll — correct.

**Current code** (`common.service.ts:100-107`) already implements this correctly.

**Count optimization (low priority):** `count()` currently calls `find()` and returns
`result.length`. Works correctly (find deduplicates), but loads all rows into memory.
Can optimize later with `COUNT(DISTINCT id)` via QueryBuilder. Not a blocker.

---

## Task 5: Pagination (limit/offset) with multi-hop

**Problem:** TypeORM applies `LIMIT` to SQL rows, not entities. If JOIN produces 2
rows per course, `LIMIT 10` returns ~5 courses instead of 10.

**Solution:** Two-step query for multi-hop + pagination:

```
Step 1: SELECT DISTINCT courses.id ... LIMIT 10 OFFSET 0 → [1, 3, 5, ...]
Step 2: SELECT * FROM courses WHERE id IN (1, 3, 5, ...) → load entities + relations
```

Without pagination (no take/skip) — regular query, dedup handles duplicates.

**Files:** `common.service.ts`

---

## Task 6: Field-level access on nested entities

**Problem:** `processDto` in `private_fields.service.ts` recurses into nested
entities with the SAME bind from root. For enroll loaded as relation of course:

```
bind = { name: 'enrolls.student.account', id: 1 }  // from COURSE
dto  = enroll { id: 4, grade: 'A' }                 // nested entity

canRead('owner', bind, dto):
  name.includes('.') → true
  dto.enrolls → undefined (this is enroll, not course!)
  → ownerEntity = undefined → return true  // FIELD VISIBLE! LEAK!
```

Alice can see Bob's `grade` field on shared courses.

**Solution (two parts):**

### Part A: `processDto` — compute nested bind on recursion

When recursing into a nested entity via key `K`:

```
bind.name starts with 'K.' → strip first segment
  Course bind: 'enrolls.student.account'
  recurse via 'enrolls'
  → Enroll bind: 'student.account'

bind.name === 'K' → end of path
  Student bind: 'account'
  recurse via 'account'
  → Account bind: { name: '', id: bind.id }

bind.name doesn't match K → off bind path
  Course bind: 'enrolls.student.account'
  recurse via 'tags'
  → Tag bind: { name: '', id: bind.id, allow: bind.allow }
```

### Part B: `canRead` — handle `name === ''`

When `name === ''`, treat the entity itself as the owner candidate:

```typescript
if (name === '') {
    ownerEntity = dto;  // the entity itself
}
```

Result for non-superuser (`allow: false`):

| Entity | `name` | `ownerEntity` | `ownerId` | owner fields |
|--------|--------|---------------|-----------|--------------|
| Enroll (on path) | `student.account` | `dto.student.account` | account.id | checked via chain |
| Account (end of path) | `''` | `dto` (account) | account.id | visible if `=== bind.id` |
| Tag (off path) | `''` | `dto` (tag) | tag.id | stripped (`tag.id ≠ bind.id`) |

For superuser (`allow: true`): all fields visible regardless.

**Account-level fields:** visible for off-path entities (`bind.id` is defined).
**Admin-level fields:** stripped for non-superuser.

**Files:** `private_fields.service.ts` (both `canRead` and `processDto`)

---

## Task 7: Automatic nested relation filtering

**Problem:** Even with whitelist allowing `course.enrolls`, TypeORM loads ALL
enrolls for the course — including other students'. Alice sees Bob's enrollment
data through nested relations.

```
Alice: GET /enrolls/find?relations=[{"name":"course.enrolls"}]

Result:
  enroll (Alice's)
    └─ course
         └─ enrolls: [Alice's, BOB'S]  ← LEAK
```

This applies to ANY relation chain that reaches entities with access control:
- `enroll.course.enrolls` — other students' enrollments
- `enroll.course.students` — all students on the course
- Any path to any entity registered in PermissionRegistry

**Solution:** Post-load filtering based on PermissionRegistry.

### Step 1: Register `accountTable` in PermissionRegistry

```typescript
// In EntityController factory, after existing PermissionRegistry.set():
PermissionRegistry.set(entity, {
    create: createAccess,
    read: readAccess,
    update: updateAccess,
    delete: deleteAccess,
    accountTable: accountTable,  // ← new field
});
```

### Step 2: Post-load filter

After TypeORM loads relations, walk the result tree and filter arrays:

```
For each entity in result tree:
  1. Look up entity type in PermissionRegistry
  2. If registered with accountTable → filter array by caller
  3. If not registered → leave as-is (no access control for this entity)
```

Filtering logic per array item:
```
nestedEntity.student.account.id === caller.id?  → KEEP
nestedEntity.student.account.id !== caller.id?  → REMOVE
```

For ToOne relations (single object): check ownership, remove if not owned (set to
undefined/null).

Superuser (`allow: true`): skip all filtering.

### Performance

Post-load filtering loads extra rows from DB then removes them in JS. Acceptable
for correctness. Can optimize later with query-level filtering (separate queries
with WHERE conditions per relation).

**Files:** `permission.registry.ts`, `entity.controller.ts`, `common.service.ts`
(new post-filter function)

---

## Task 8: Sorting relations test

**Problem:** `relationsOrder()` works post-TypeORM. Should work regardless of
bindPath, but untested.

**Solution:** Add test case:
```json
GET /courses/find?relations=[{"name":"enrolls","order":"createdAt","desc":true}]
```

Verify enrolls array is sorted by createdAt descending.

**Files:** `enrollment-access.spec.ts` (or new spec file)

---

## Implementation order

| Priority | Task | Complexity | Security impact |
|----------|------|------------|-----------------|
| 1 | Task 2: Operations deny-by-default | Trivial | High — closes default routes |
| 2 | Task 1: Relations whitelist (deny by default) | Medium | High — blocks relation leak |
| 3 | Task 7: Nested relation auto-filtering | High | High — blocks cross-entity leak |
| 4 | Task 6: Field access on nested entities | Medium | High — blocks field leak |
| 5 | Task 5: Pagination fix | High | Correctness |
| 6 | Task 3: Multi-hop auto-assign | High | Feature |
| 7 | Task 8: Sorting test | Trivial | Verification |

Task 4 (dedup) — resolved, no changes needed.

---

## Resolved questions

### Q1: RESOLVED — strip

Client requests a relation not in the controller's whitelist → silently remove it,
process the valid part of the request. Client responsibility to check response.
No 403.

### Q2: RESOLVED — dedup stays

Deduplication stays. Course-centric view: one course per record, enrolls array
contains all enrollments. When querying enrolls directly, each enroll is a separate
record (no dedup). See Task 4 for details.

### Q3: RESOLVED — fail-closed

Non-bind-path nested entities (e.g. `tags`) get `bind = { name: '', id: bind.id,
allow: bind.allow }`. Owner fields stripped because `tag.id ≠ account.id`.
Superuser sees everything via `allow: true`. Account-level fields remain visible
(`bind.id` is defined). See Task 6 for full design.

### Q4: RESOLVED — deny-by-default for operations AND relations

Both operations and relations default to closed/deny. Developer must explicitly
open access. Fields remain public by default. See Security philosophy section.
