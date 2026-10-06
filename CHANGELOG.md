# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.32.0] - 2026-10-06
### Added
- **Audit volume control: `AUDIT_ENABLED` kill switch + include/exclude
  action filter** (`AuditModule.forRoot({ filter })` / env
  `AUDIT_ENABLED` / `AUDIT_INCLUDE` / `AUDIT_EXCLUDE`). Applied at the
  source inside `AuditService.log` — a filtered entry produces no bus
  traffic, no outbox rows, no store growth. Matching is dot-path prefix
  on segment boundaries (`auth` matches `auth.login.failed`, not
  `audit.x`); order: disabled → include miss → exclude hit; defaults keep
  everything, so existing services are unaffected. The resolved filter is
  logged at boot, suspicious entries warn, and
  `audit_events_total{result="passed|filtered|disabled"}` is counted in
  the `MetricsService` registry when one is bound. Companion to the
  event-server 0.10.0 retention CLI — see both READMEs.

## [0.31.0] - 2026-10-05
### Changed
- **typeorm 1.x compatibility** (peer range widened to `^0.3.20 || ^1.1.0`;
  devDep stays on 0.3 — the fleet still runs 0.3). Two deltas of the 1.x
  line are absorbed:
  - `relationsToFindOptions` (relations.service) — typeorm 1.x removed the
    string[] form of `FindOptionsRelations`; the toolkit keeps the string[]
    public API (FindDto.relations, EntityController whitelists, bind-built
    relation names) and converts dot-paths to the object tree at every
    `repository.find`/`count` boundary. typeorm 0.3 accepts the object form
    too, so behavior is identical on both majors.
  - `BooleanColumn` no longer passes `width` (removed from ColumnOptions in
    1.x; a MySQL-ism always ignored on postgres) and passes `comment` only
    when set.
  Verified against BOTH majors locally: 659/659 on 1.1.1 and 659/659 on
  0.3.31.

## [0.30.0] - 2026-10-05
### Added
- `QueueWorkerConfig.concurrency` (default 1) — bounded worker pool over a
  claimed batch. 1 reproduces the historical sequential loop; higher values
  fan the batch out in parallel (journal №7: the mail pipeline sent one
  SMTP letter at a time regardless of batch size). Claiming stays batched
  and locked (SKIP LOCKED), so multi-replica deployments remain safe.

## [0.29.1] - 2026-10-05
### Changed
- Audit events are published at `priority: 'low'` — at equal priority a
  sustained audit flood (login storms fire one audit event per probe)
  starved real deliveries behind the event bus FIFO claim queue
  (journal 14, storm14 R2c: honest p95 33.6s at a ~33k zombie backlog;
  with the priority split, p95 611ms at the same backlog size).

## [0.29.0] - 2026-10-04
### Changed
- **BREAKING: `OutboxEventClient.publish` is strict** — it now rejects when
  the outbox insert fails, in both modes (with and without
  `PublishOptions.manager`). The 0.28.0 never-rejects compatibility bridge
  (swallow + log without a manager) is removed while the codebase is still
  pre-RC; no consumers carried the old contract beyond auth-server, which is
  updated in the same pass. Callers must handle the failure explicitly:
  `await publish(p, x, { manager })` (transactional), `await publish(p, x)`
  (visible failure), or `publish(p, x).catch(log)` (deliberate
  fire-and-forget); unawaited calls risk an unhandled-rejection process
  crash (Node 15+). `HttpEventClient` keeps its swallow-and-log behavior —
  it is the legacy transport, not the durable one.

## [0.28.0] - 2026-10-04
### Added
- **`OutboxModule.forRoot(entity)` — durable event publishing** — a
  fire-and-forget `HttpEventClient.publish` loses events on process crashes
  (measured: 18% under kill windows in the LMS load case) and swallows
  event-server outages. The outbox client persists the envelope into the
  service-local `event_outbox` table and a relay worker (QueueWorker
  machinery: SKIP LOCKED claim, exponential backoff, stale reclaim, cleanup)
  delivers to event-server with retries; a permanently failed row stays
  replayable in the table. Contract parity: same `IEventClient` token, same
  wire envelope — services swap one imported module and add one migration.
  `PublishOptions.manager` writes the event row in the caller's transaction
  (atomic with the business change); without it publish() never rejects,
  matching the old fire-and-forget contract. Services declare a local
  `@Entity('event_outbox')` subclass of `EventOutboxEntity` (glob-based
  entity loading). New exports: `OutboxModule`, `OutboxEventClient`,
  `OutboxRelayWorker`, `EventOutboxEntity`, `OutboxOptions`,
  `OUTBOX_REPOSITORY`, `buildEventEnvelope`; `PublishOptions` gains
  `manager?`.

## [0.27.0] - 2026-10-03
### Added
- **`@CreateOnly()` DTO decorator (write-once fields)** — a DTO property marked
  `@CreateOnly()` passes on `create` and is silently stripped on `update`
  (enforced in `CommonService.update`, before `stripWriteFields`). The rule is
  tied to the DTO class: the same column stays writable through other
  controllers/DTOs without the decorator. Exports: `CreateOnly()`,
  `createOnlyFieldsOf(dto)`, `stripCreateOnlyFields(entity, dto)`.
- **`claimSlot()` capacity helper** — atomic slot claiming across candidate
  rows: `UPDATE ... SET taken = taken + 1 WHERE id = :id AND taken < capacity
  RETURNING id` per candidate in order; overbooking impossible under
  concurrency. Default columns `capacity`/`taken`, overridable; pass a
  transaction repository to claim inside a transaction.
### Fixed
- **EntityController: no-op delete/restore answers 404, not 200 `false`**: `remove` / `hardDelete` / `restore` returned the `CommonService` boolean as-is — an out-of-scope (or already deleted) row produced `200 {"false"}` instead of `404`, inconsistent with `update` (rows outside scope → 404 per the Access model). All three handlers now throw `NotFoundException` when nothing matched. Caught by stage-3 E2E on the live stack (`other owner delete → 404`).
### Tests
- `create-only.decorator.spec` — metadata/inheritance, strip on update (DTO instance) vs create passthrough, plain-object no-contract semantics.
- `capacity.helper.spec` — claim order, full-candidate fallback, empty list, custom column resolution via entity metadata.

## [0.26.2] - 2026-10-02
### Fixed
- **Multi-hop (dot-path) bind names больше не попадают в атомарные criteria update/delete**: `bindCriteria` клал `article.account` ключом criteria — TypeORM в update/delete не резолвит dot-path без join-алиасов и падал «Cannot find alias for relation at article» (regression 0.26.0, пойман api-server bind-multi-hop MH10). Dot-path бинды снова под защитой existsInScope pre-check; атомарный критерий в самом запросе остаётся для single-hop/id/tenant.
- `remove-scope.spec` — регрессия на форму criteria (single-hop в запросе, dot-path только id, allow → пустой скоуп).

## [0.26.1] - 2026-10-01
### Security
- **Egress validator: trailing-dot hostname normalization** — `http://localhost./`, `http://127.0.0.1./`, `http://10.0.0.5./` slipped past the `public`-mode filters (the trailing DNS root dot defeated both the "bare name has no dot" rule and the IPv4 parse). Hostnames are now root-stripped before every name/rule check, and allowlist comparison matches the root form too (`message-server.` == `message-server`).

## [0.26.0] - 2026-10-01
### Security (Wave 6 audit — access-model and write-path hardening)
- **`matchRoles`: empty rules now deny explicitly** — `[]` means "no roles allowed" (deny), `undefined` means "rule not configured" (allow). Previously `[]` silently matched everyone: a field rule `{ response: [] }` intended to hide a field exposed it to all roles.
- **`@Access([])` / `accessBind([])` fail loud** — empty rules throw `ForbiddenException` instead of falling through to the service default `allow: true` bypass; `AccessGuard` audits and denies empty rule sets (a missing `@Access()` metadata still passes — unadorned routes are intentional, empty metadata is a mistake).
- **`prepareAndUpdate` re-stamps owner/tenant/auto-assign** — update ignored bind-derived fields, so a client payload could re-point `author.id` / `tenant.id` to another owner/tenant (create stamped them, update didn't). Update now mirrors `prepareAndCreate`: bind owner, tenant, and auto-assign fields are overwritten from the resolved bind, client values ignored.
- **`stripWriteFields` strips tenant path too** — request field-rules removed only the owner path; the tenant relation id (`tenantId`/`tenantName`) stayed writable and could bypass the re-stamp. Both bind paths are now stripped together.
- **`tenant: 'id'` scope rejected at compile** — `{ tenant: 'id' }` (the entity's own column) is not a relation join; it compiled to a broken/absent condition. `compileRuleToBind` throws with a hint to use a relation path like `tenant.id`.
- **`filter` × array where (OR branches)** — `bind.filter` merged over an array `where` (from `mergeSearchWhere`) spread the array's numeric keys into one object, producing `{0: …, 1: …}` and a 500 from TypeORM. `mergeFilter` now merges the filter into every OR branch.
- **TenantMiddleware fail-loud + hardening** — without `req.user` under a non-`where` strategy it silently ran with no tenant isolation; it now throws at request time with wiring instructions. Non-numeric tenant ids are rejected; the schema `search_path` is quoted (`SET search_path TO "tenant_42"`); the query runner is released exactly once via `res.once('finish'/'close')`.
- **Nested filter respects tenant scope** — `filterNestedRelations` honored owner binds but ignored tenant binds: nested relation rows from another tenant survived in responses. Tenant mode filters nested arrays/objects by the bind tenant.
- **Unique probe scoped** — `findUniqueEntry` matched rows regardless of owner/tenant/soft-delete state, so a soft-deleted (or foreign-scope) row with the same unique value surfaced as a duplicate conflict. The probe now applies bind owner/tenant conditions and `deleted_at IS NULL`.
- **Delete/restore criteria are atomic** — `softRemove`/`hardRemove`/`restoreDeleted` accepted an extra `scopeWhere` merged into the update/delete criteria (`{ ...scopeWhere, id }`), closing the check-then-act race between `existsInScope` and the write; `CommonService` passes the bind criteria through.
- **`executeSortPosition` locks rows** — positions were written from a possibly stale snapshot; the page rows are re-read under `pessimistic_write` inside the transaction and fresh rows are saved.
- **`httpPost`/`httpGet` `redirect` option** — `HttpOptions.redirect` passes through to `fetch`; egress-restricted callers (event-server delivery) can use `redirect: 'manual'` to re-validate redirect targets instead of silently following them.
- **Prototype-pollution guard in tree service** — `setDeepValue` refuses `__proto__`/`constructor`/`prototype` keys instead of writing into `Object.prototype`.

### Tests
- 9 new regression tests (`wave6-audit.spec`) covering each fix above; updated specs that encoded the old (vulnerable) behavior: tenant middleware (fail-loud, quoted search_path, single release), access guard (empty-rules deny + no-metadata pass), position helper (locked re-read and fresh-row saves), delete helper (criteria-object assertions, scope predicate).

## [0.25.1] - 2026-10-01
### Fixed
- **v1 keeps the legacy lenient key parse** (caught live on the stand 30 minutes after 0.25.0): stacks can carry a non-hex `AES_SECRET` — the pre-0.25.0 code silently parsed non-hex pairs as `NaN → byte 0`, so 0.25.0's strict hex validation rejected their key outright (2FA setup / OAuth token saves failed with "Expected a hex string") and, worse, could never decrypt existing envelopes. Version 1 now reproduces the legacy `NaN → 0` bytes exactly (old envelopes stay readable through rotation); versions 2+ require real hex — a typo there must not collapse the key. Recommend `openssl rand -hex 32` for new keys.

## [0.25.0] - 2026-10-01
### Added
- **AES key versioning for secret rotation** (`crypt.service`): envelopes carry a `v` field; `AES_SECRET` stays version 1, `AES_SECRET_V2`…`AES_SECRET_V9` extend it, the **highest configured version is current** (`encrypt()` stamps it, `decrypt()` dispatches on it). Envelopes written before this change (no `v`) keep decrypting with `AES_SECRET` — the system works mid-rotation with no data migration; the one-pass re-encrypt lives in auth-server (`scripts/reencrypt-aes.mjs`). Runbook: gateway-server `docs/secret-rotation.md`.
- **`InternalAuthGuard` rotation window**: `INTERNAL_API_KEY_PREVIOUS` (comma-separated) stays valid alongside the current key, per-key constant-time comparison unchanged, fail-closed unchanged. (`API_KEYS` already rotates additively — the comma list is the window.)

### Tests
- 20 new: AES version round-trips (current-version stamping, legacy envelope without `v`, wrong-version key rejection, unconfigured version message, no-key error), internal-key dual window (previous accepted, retired rejected, blanks ignored).

## [0.24.2] - 2026-10-01
### Fixed
- **`passport` declared in `dependencies`**: `bootstrap/setup/passport.ts` does `require('passport')` at runtime, but the package never declared it (only a leftover `peerDependenciesMeta` entry). With `--legacy-peer-deps` installs (CI, docker builds) `@nestjs/passport@11` leaves the peer unsatisfied — the toolkit's own SBOM step failed with `ESBOMPROBLEMS: missing: passport`, and a consumer calling `Passport.setup()` without its own passport dependency would crash at boot. Version `^0.7.0` matches what every passport-using service already declares (dedupes to one copy).

## [0.24.1] - 2026-10-01
### Added
- `AccountStrategy`: optional JWT `iss`/`aud` claim verification via `JWT_ISSUER`/`JWT_AUDIENCE` — aligns with gateway pass-through; verified e2e through nginx (token with claims accepted, without → 401).

## [0.24.0] - 2026-10-01
### Added
- Signed event deliveries: webhook-signature helper + `EventDeliveryGuard` — subscribers verify `X-Webhook-Signature` (HMAC) instead of trusting network position.

## [0.23.0] - 2026-09-30
### Added
- **`runMigrationsUnderLock(option, lockKey?)`** (root export): runs pending TypeORM migrations under a PostgreSQL transaction-local advisory lock (`pg_advisory_xact_lock` held by an explicit transaction for the whole `runMigrations()` call). TypeORM 0.3.x has no built-in migration locking, so simultaneously booting replicas raced on a cold database (both running `InitialSchema` → one crashes with «relation already exists»). The transaction-scoped lock works behind pgbouncer in transaction-pooling mode, where a session-level `pg_advisory_lock` could be released from a different backend connection. Non-PostgreSQL drivers run unlocked; the throwaway DataSource is destroyed in every code path and `migrationsRun` is stripped from the returned options — services call it from `dataSourceFactory` before constructing the app DataSource. Exposed as the `api-server-toolkit/db` subpath (root barrel + `exports`/`typesVersions`) — event/message don't ship `@nestjs/passport`, so they must not import the root barrel. All four DB services (api/auth/event/message) wire it; boot migrations are now multi-replica safe out of the box (a one-per-deploy `migration:run` remains the recommendation for large fleets — it removes migration time from boot entirely).

## [0.22.0] - 2026-09-30
### Fixed
- **`AccessRule.filter` was never compiled into the bind** (self-pentest, critical): a public read rule like `{ who: ['public'], filter: { isPublished: true } }` imposed no restriction — the filter was dead code, and a scope-`all` match compiled to `undefined`, which hit the service-level default `{ allow: true }` (trusted-call bypass). `compileRuleToBind` now returns an explicit bind for scope-`all`, carries `rule.filter` into the bind (`buildFindWhere`/`buildCountWhere` merge it over the client `where` — filter wins), and `bind.roles` drives field stripping (`removePrivateFields`/`stripWriteFields`), so response/request field rules apply on service-level calls too.
- **Cross-tenant delete by id** (self-pentest, critical): `remove`/`hardDelete`/`restore` scope-checked only owner binds (`bind.id`); a tenant bind (`bind.tenantId`, no `id`) silently skipped the check, so any id from another tenant was removable at `TENANT_STRATEGY=where`. All three now verify via `existsInScope` — the row must exist *and* fall inside the bind, for every non-allow bind. `restore` checks scope with soft-delete filtering disabled (`includeDeleted`) — previously it looked for `deleted_at IS NULL` and always refused to restore.
- **Owner/tenant binds fail closed**: `compileRuleToBind` for an owner scope without `account.id` (or a tenant scope without `account.tenantId`) used to silently skip the stamp — producing an unscoped query over the whole table. It now throws `ForbiddenException`.
- **`movePosition` range-shift ignored scope**: the `position ± 1` update over the shift range had no bind stamps, so moving one entry renumbered other owners'/tenants' rows in range. The range update is now stamped with the owner/tenant condition (same as `executeSortPosition`).
- **Search no longer widens relation loading**: a search term on a dotted field (`account.email`) pushed that relation into `relationNames`, bypassing the caller's relations whitelist — the JOIN would pull unrelated data into the response. Nested where executes without loading the relation; only explicitly requested relations load.
- **`distinctAlias` error on paginated scoped finds**: `take` + a bind-driven implicit relation join + a custom `select` without the primary key produced «column distinctAlias.&lt;entity&gt;_id does not exist» (TypeORM references the PK in its DISTINCT subquery). `executeFind` now adds `id` to the select in that combination; `movePosition`'s internal findOne selects `id` too.
- **Client IP spoofing via `X-Forwarded-For`** (self-pentest): helpers parsed the raw `x-forwarded-for` header, whose leftmost element is client-controlled — audit logs and rate-limit buckets could be poisoned by header injection. New `getClientIp()` uses Express `req.ip` (right-most trusted proxy appended value); `bootstrap()` now sets `app.set('trust proxy', N)` from the `TRUST_PROXY` env (default `1` — one reverse proxy in front, nginx). Parsers in `AuditInterceptor`, `AccessGuard` and `AddClientIpInterceptor` switched to `getClientIp()`.

### Added
- `getClientIp(request)` helper (root export) — the single supported way to read a client IP server-side.
- `BootstrapOptions.trustProxy` / `TRUST_PROXY` env (`false`/`true`/number/hop-string, default `1`).

## [0.21.1] - 2026-09-30
### Fixed
- `AuditModule.forRoot()` did not resolve `IEventClient`: `AuditService` is a provider of `AuditModule`, and Nest module scopes are not shared — an `EventClientModule` imported at the app root is invisible to it, so the client stayed `undefined` and every audit entry silently degraded to the fallback log line (found by a new DI-wiring test that compiles the real module graph). `forRoot()` now imports `EventClientModule` itself. Apps that bind their own `IEventClient` pass `client: false` and expose it via the new `imports` option.

## [0.21.0] - 2026-09-30
### Added
- **Audit logging** (`AuditModule`, `AuditService`, `AuditInterceptor`): security-relevant events are published to the event bus as `audit.event` (contract owned by event-server, hash-chained append-only storage there). `AuditModule.forRoot({ mutations?: boolean })` is a `@Global()` module; `AuditService.log()` is fire-and-forget, injects `requestId` from the request-scoped ALS, and falls back to a structured `audit-fallback {...}` log line when no `IEventClient` is bound. When `mutations !== false`, an `APP_INTERCEPTOR` records non-GET 2xx responses as `data.created` / `data.updated` / `data.deleted`.
- `AccessGuard` now accepts an optional `AuditService` and logs `access.denied` (outcome `deny`, with route, method, roles, ip, user-agent) on every 403 before throwing. Passing it is opt-in per module: import `AuditModule.forRoot()` and Nest resolves the dependency.

## [0.20.3] - 2026-09-29
### Fixed
- `QueueWorker` claim: Postgres rejects `FOR UPDATE` on the nullable side of an outer join, so any worker whose `loadRelations` override adds a `leftJoinAndSelect` (e.g. MailWorker hydrating `data.attachments`) failed every cycle with «FOR UPDATE cannot be applied to the nullable side of an outer join» and jobs stayed `pending` forever. Candidate ids are now locked first (`SELECT id ... FOR UPDATE SKIP LOCKED`), then relations are hydrated by a second, lock-free query inside the same transaction — rows stay locked until commit, so claiming semantics are unchanged.
- `QueueWorker` claim: the follow-up status update was built with `createQueryBuilder('j').update()` — Postgres has no FROM clause in `UPDATE`, so the aliased `WHERE "j"."id"` failed with «missing FROM-clause entry for table "j"». Replaced with a plain `repo.update(ids, ...)`.

## [0.20.2] - 2026-09-29
### Fixed
- `bootstrap()` now binds `0.0.0.0` by default. The previous default (`localhost`) made services loopback-only, which is unreachable cross-container — nginx proxied every route to 502 and inter-service webhooks could not connect. Pass an explicit `ip` to narrow the binding.

## [0.20.1] - 2026-09-29

### Fixed
- `AuthClientService` account-info cache grew without bound: entries expired by TTL but were never removed from the `Map`, so memory scaled with the number of distinct account ids per process lifetime. The cache is now an LRU: `AUTH_CACHE_MAX` caps entries (default 10000, least recently used evicted), cache hits refresh recency, expired entries are dropped on access.

## [0.20.0] - 2026-09-28

### Added
- Structured logging: `LOG_FORMAT=json` turns `Log.setup` into a one-line JSON logger with an `X-Request-Id` middleware — incoming ids are honored (sanitized, ≤128 chars), otherwise a UUID is generated; the id is echoed on the response and attached to every log line inside the request via AsyncLocalStorage. `getRequestId()`, `requestContextMiddleware`, `JsonLogger` exported from the root and the new `api-server-toolkit/logger` subpath. Morgan's `json` access-log format carries `requestId` too.

### Fixed
- Morgan `json` format was silently ignored: `morgan('json', fn)` treats `fn` as the options object, so the custom JSON fields (timestamp, userAgent, camelCase timing) never reached the output and the predefined morgan json format was logged instead. The format function is now passed as the first argument.

## [0.19.0] - 2026-09-28

### Added
- `MetricsModule.forRoot({ service, defaultLabels?, defaultMetricsInterval? })` — Prometheus observability: `GET /metrics` endpoint (`prom-client`), Node.js/process default metrics, and automatic HTTP instrumentation (method / route-pattern / status / duration via a global interceptor; `/metrics` itself excluded). All metrics carry a `service` label. Custom counters/gauges/histograms via `MetricsService.counter()/gauge()/histogram()`. Subpath import: `api-server-toolkit/metrics`.

### Removed
- `Telemetry` bootstrap stub — it was dead code (referenced a non-existent package and no service called it). Distributed tracing is deferred until there is a collector to receive spans; `httpPost` keeps propagating OTel trace headers when `@opentelemetry/api` is present.

### Fixed
- `httpPost`/`httpGet` — no longer crash when the fetch response has no `headers` (minimal fetch mocks in consumer tests made every webhook delivery look "failed").

## [0.18.0] - 2026-09-28

### Added
- `ApiKeyGuard` + `@ApiKey()` decorator — static API key access for external integrations (B2B customers without JWT accounts / OAuth clients) and dev environments. Keys in env `API_KEYS` (comma-separated, `openssl rand -hex 32`), `X-Api-Key` header, constant-time comparison, fail-closed without configuration. On success the request gets the synthetic `api` role (`API_ROLE`) — Access-model rules open routes to key clients with `{ who: ['api'] }`. Combines with JWT (identity preserved, `api` role added).

## [0.17.0] - 2026-09-28

Security hardening release. Breaking: no backward compatibility is provided by design.

### Removed
- `SecureGuard`, `SimpleSecureGuard`, `@Secure`, `@SimpleSecure`, `tokenValidate`, `tokenValidateSimple` — legacy MD5/static-token guards. Use `@Account()` (JWT) and `InternalAuthGuard` instead.

### Changed
- `Cors.setup` — origin reflection (`origin: true` + `credentials: true`) replaced with an allowlist. Allowed origins come from the `CORS_ORIGINS` env var (comma-separated) or the `{ origins }` option. Matched origins are echoed exactly (`Vary: Origin`); everything else receives no CORS headers. Empty allowlist = CORS disabled.
- `InternalAuthGuard` — API key comparison is now constant-time (`timingSafeEqual`).
- `Cookie` service — `sameSite: 'lax'` on all cookies (`httpOnly` and production-only `secure` were already set).

> Note: versions 0.10.0–0.16.0 shipped without CHANGELOG entries. Highlights, briefly: AccessRule access model with `who`/`scope`/`filter` and `FieldRule` with `response`/`request` keys (renamed from `read`/`write`), thin `bootstrap()` + named middleware setup utilities, `httpPost`/`httpGet` typed helpers, account info auth-client with caching, queue worker with stale-job reclaim.

## [0.9.0] - 2026-08-03

Reset to pre-release versioning. The toolkit is feature-complete and well-tested (111 tests), but the overall stack is not yet production-hardened. 1.0.0 will be tagged when all services reach production readiness.

### Added
- `join` parameter wired through `EntityController` find route.
- `HealthModule`, `bootstrap()`, subpath exports (`/health`, `/bootstrap`, `/helper`, `/guard`, `/client`).

### Changed
- Version reset from 2.x.x to 0.9.0. Previous v2.x tags reflected stack alignment, not production maturity.

## [2.2.0] - 2026-08-03

### Added
- `join` parameter wired through `EntityController` find route. The `FindDto.join` field was already defined but never forwarded by the controller. Now `GET /find?join=true` activates SQL JOIN mode for relations instead of the default batch-loading strategy.

## [2.1.0] - 2026-08-02

### Added
- `HealthModule` — dynamic module with `forRoot(serviceName)`. Replaces per-service health controller boilerplate. Available via `api-server-toolkit/health` subpath.
- `bootstrap()` — shared NestJS application startup function. Encapsulates Sentry init, helmet, ValidationPipe, Swagger, Redoc, morgan, cookie-parser, passport, typeorm-transactional, graceful shutdown. Available via `api-server-toolkit/bootstrap` subpath.
- `BootstrapOptions` interface — configures cors, swagger, morgan, cookieParser, passport, transactional, and a `beforeListen` hook for service-specific middleware.
- `/health` subpath export — import HealthModule without loading the full barrel (avoids pulling in @nestjs/passport for services that don't use it).
- `/bootstrap` subpath export — import bootstrap() without affecting tree-shaking of the main barrel.
- `peerDependenciesMeta` — optional peer deps (helmet, morgan, cookie-parser, passport, redoc-express, typeorm-transactional) marked as optional to avoid npm warnings in services that don't use bootstrap().

### Changed
- `@nestjs/passport` peer dependency is now optional (was required in v2.0.0). Services like event-server that don't use auth decorators can now install toolkit without passport.

## [2.0.0] - 2026-07-15

### Added
- Full CRUD engine: `CommonService`, `EntityController`, search/where/sanitize services.
- Column decorators: `IdColumn`, `VarcharColumn`, `TextColumn`, `IntColumn`, `SmallIntColumn`, `BigIntColumn`, `FloatColumn`, `BooleanColumn`, `DateColumn`, `JsonColumn`, `CreatedColumn`, `UpdatedColumn`, `EnumColumn`, `IndexedColumn`.
- DTO decorators: `DtoColumn`, `DtoCreatedColumn`, `DtoUpdatedColumn`, `DtoEnumColumn`, `DtoJsonColumn`.
- Guards: `InternalAuthGuard`, `SecureGuard`, `SimpleSecureGuard`.
- Queue system: `QueueJobEntity`, `QueueWorker`, `QueueService`.
- Inter-service communication: `IEventClient`, `HttpEventClient`, `EventClientModule`.
- HTTP helpers: `httpPost`, `httpGet` (native fetch wrapper).
- Subpath exports: `/guard`, `/client`, `/helper`.
- Batch loader, permission registry, private fields filter.
- Test suite: 8 suites, 111 tests.
