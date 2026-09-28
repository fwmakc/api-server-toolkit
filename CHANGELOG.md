# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
