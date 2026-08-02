# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
