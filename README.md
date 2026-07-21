# @core/common

Shared CRUD engine, decorators, guards, and event bus for NestJS microservices.

## Contents

- **common/** -- CRUD engine: EntityController, CommonService, columns, decorators, guards, helpers, interceptors, services (bind, crypt, csv, dynamic SQL, search, where, etc.)
- **event-bus/** -- Redis Streams event bus via `@nestjs/microservices` (EventBusModule, EventBusService, EventBusPattern constants)

## Installation

```bash
# From tarball (local dev)
npm install @core/common@file:../shared/core-common-1.0.0.tgz

# From GitHub (Docker/CI)
npm install @core/common@git+https://github.com/fwmakc/shared.git#master
```

## Usage

```typescript
import {
  EntityController,
  CommonService,
  CommonDto,
  Account,
  Self,
  AccountLike,
  EventBusModule,
  EventBusService,
  EventBusPattern,
} from '@core/common';
```

## Building

```bash
cd shared/
npm install
npm run build   # compiles src/ -> dist/
npm pack        # creates core-common-1.0.0.tgz
```

dist/ is committed for git URL installs.
