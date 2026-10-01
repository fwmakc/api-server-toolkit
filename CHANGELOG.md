# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
