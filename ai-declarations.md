# api-server-toolkit — Type Declarations

This file is auto-generated for AI-assisted development.
Feed it to your LLM (Claude, ChatGPT, etc.) to get framework-aware code without hallucinations.

Generated from 221 declaration files.

---

## dist\__tests__\__mocks__\cookie-parser.d.ts

```typescript

```

## dist\__tests__\__mocks__\morgan.d.ts

```typescript

```

## dist\__tests__\__mocks__\nestjs-passport.d.ts

```typescript
export declare function AuthGuard(..._args: any[]): {
    new (): {
        canActivate(): boolean;
    };
};
```

## dist\__tests__\__mocks__\passport.d.ts

```typescript
export declare const Strategy: {
    new (): {};
};
export declare const initialize: () => jest.Mock<any, any, any>;
```

## dist\__tests__\__mocks__\sentry-nestjs.d.ts

```typescript

```

## dist\__tests__\access.guard.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\access.rules.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\access.validator.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\add-client-ip.interceptor.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\api-key.guard.spec.d.ts

```typescript
export {};
```

## dist\__tests__\array.helper.spec.d.ts

```typescript
export {};
```

## dist\__tests__\audit.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\auth-client.service.spec.d.ts

```typescript
export {};
```

## dist\__tests__\batch-loader.service.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\bind-path.service.spec.d.ts

```typescript
export {};
```

## dist\__tests__\bind-resolve.helper.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\bootstrap.setup.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\bootstrap.thin.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\capacity.helper.spec.d.ts

```typescript
export {};
```

## dist\__tests__\column.factories.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\cookie.service.spec.d.ts

```typescript
export {};
```

## dist\__tests__\create-only.decorator.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\crypt.service.spec.d.ts

```typescript
export {};
```

## dist\__tests__\delete.helper.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\dto.column.validators.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\entity.controller.remove-404.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\event-delivery.guard.spec.d.ts

```typescript
import "reflect-metadata";
```

## dist\__tests__\find.helper.executeFind.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\find.helper.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\health.controller.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\http.helper.spec.d.ts

```typescript
export {};
```

## dist\__tests__\internal-auth.guard.spec.d.ts

```typescript
export {};
```

## dist\__tests__\logger.spec.d.ts

```typescript
export {};
```

## dist\__tests__\metrics.spec.d.ts

```typescript
export {};
```

## dist\__tests__\migrations-lock.spec.d.ts

```typescript
export {};
```

## dist\__tests__\nested_filter.service.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\object.helper.spec.d.ts

```typescript
export {};
```

## dist\__tests__\outbox.spec.d.ts

```typescript
export {};
```

## dist\__tests__\permission.registry.spec.d.ts

```typescript
export {};
```

## dist\__tests__\position.helper.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\private-fields.service.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\queue-worker.spec.d.ts

```typescript
export {};
```

## dist\__tests__\relations.service.spec.d.ts

```typescript
export {};
```

## dist\__tests__\remove-private.interceptor.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\remove-scope.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\safe-id.pipe.spec.d.ts

```typescript
export {};
```

## dist\__tests__\sanitize.service.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\scalar.helper.spec.d.ts

```typescript
export {};
```

## dist\__tests__\search.service.spec.d.ts

```typescript
export {};
```

## dist\__tests__\soft-delete.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\string.helper.spec.d.ts

```typescript
export {};
```

## dist\__tests__\tenant-connection.manager.spec.d.ts

```typescript
export {};
```

## dist\__tests__\tenant-context.spec.d.ts

```typescript
export {};
```

## dist\__tests__\tenant-module.spec.d.ts

```typescript
export {};
```

## dist\__tests__\tenant-strategy.spec.d.ts

```typescript
export {};
```

## dist\__tests__\tenant.middleware.spec.d.ts

```typescript
export {};
```

## dist\__tests__\tenant.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\tree.service.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\unique.helper.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\wave6-audit.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\webhook-signature.helper.spec.d.ts

```typescript
export {};
```

## dist\__tests__\where.service.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\write.helper.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\bootstrap.d.ts

```typescript
export * from './common/bootstrap/bootstrap.service';
```

## dist\client.d.ts

```typescript
export * from './common/client/event-client.interfaces';
export * from './common/client/event-client.service';
export * from './common/client/event-client.module';
export * from './common/client/outbox.entity';
export * from './common/client/outbox.envelope';
export * from './common/client/outbox-client.service';
export * from './common/client/outbox-relay.service';
export * from './common/client/outbox.module';
```

## dist\common\access.module.d.ts

```typescript
import { DynamicModule, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
export declare class AccessValidationService implements OnModuleInit {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    onModuleInit(): void;
}
export declare class AccessModule {
    static forRoot(): DynamicModule;
}
```

## dist\common\access.rules.d.ts

```typescript
import { AccountInfo, RoleName } from './access.type';
import { BindDto } from './dto/bind.dto';
export declare const PUBLIC_ROLE = "public";
export declare const AUTHENTICATED_ROLE = "authenticated";
export declare const SUPERUSER_ROLE = "superuser";
export declare const API_ROLE = "api";
export type OperationName = 'read' | 'create' | 'update' | 'delete';
export type AccessScope = 'all' | {
    tenant: string;
} | {
    owner: string;
};
export interface AccessRule {
    who?: RoleName[];
    scope?: AccessScope;
    filter?: Record<string, unknown>;
}
export interface FieldRule {
    response?: AccessRule[];
    request?: AccessRule[];
}
export interface EntityAccessConfig {
    operations?: Partial<Record<OperationName, AccessRule[]>>;
    fields?: Record<string, FieldRule>;
}
export declare function normalizeRuleNames(who: RoleName[] | undefined): RoleName[];
export declare function normalizeAccount(account: AccountInfo | undefined | null): AccountInfo | undefined;
export declare function anonymousAccount(): AccountInfo;
export interface MatchedRule {
    rule: AccessRule;
    roles: RoleName[];
    scope: AccessScope;
}
export declare function rolesOf(account: Partial<AccountInfo> | undefined | null): string[];
export declare function matchRule(rules: AccessRule[] | undefined, account: AccountInfo | undefined | null): MatchedRule | undefined;
export declare function matchWho(rules: AccessRule[] | undefined, account: Partial<AccountInfo> | undefined | null): boolean;
export declare function matchRoles(rules: AccessRule[] | undefined, roles: string[]): boolean;
export declare function parseAccessPath(path: string): {
    name: string;
    key: string;
};
export declare function compileRuleToBind(matched: MatchedRule | undefined, account: AccountInfo | undefined | null): BindDto | undefined;
export declare function accessBind(rules: AccessRule[] | undefined, account: AccountInfo | undefined | null): BindDto | undefined;
export declare function isPublicRules(rules: AccessRule[] | undefined): boolean;
```

## dist\common\access.type.d.ts

```typescript
export declare enum TenantScope {
    OWN = "own",
    ALL = "all"
}
export type RoleName = string;
export type TenantScopeValue = TenantScope | string | string[];
export interface RoleEntry {
    role: RoleName;
    tenant?: TenantScopeValue;
}
export interface AccountInfo {
    id: number | string;
    username?: string;
    isActivated?: boolean;
    isSuperuser?: boolean;
    tenantId?: number | string;
    roles?: string[];
    roleEntries?: Array<{
        role: string;
        tenant?: string;
    }>;
}
```

## dist\common\access.validator.d.ts

```typescript
import { DataSource, EntityMetadata } from 'typeorm';
import { EntityAccessConfig } from './access.rules';
export declare function validateAccessRegistry(dataSource: DataSource): void;
export declare function validateEntityAccess(metadata: EntityMetadata, config: EntityAccessConfig): string[];
```

## dist\common\audit\audit.interceptor.d.ts

```typescript
import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuditService } from './audit.service';
export declare class AuditInterceptor implements NestInterceptor {
    private readonly audit;
    constructor(audit: AuditService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
}
```

## dist\common\audit\audit.module.d.ts

```typescript
import { DynamicModule, Type } from '@nestjs/common';
export interface AuditModuleOptions {
    mutations?: boolean;
    client?: boolean;
    imports?: Array<DynamicModule | Type>;
}
export declare class AuditModule {
    static forRoot(options?: AuditModuleOptions): DynamicModule;
}
```

## dist\common\audit\audit.service.d.ts

```typescript
import { IEventClient } from '../client/event-client.interfaces';
export declare const AUDIT_EVENT_PATTERN = "audit.event";
export interface AuditEntry {
    action: string;
    outcome?: 'allow' | 'deny' | 'success' | 'failure';
    accountId?: number | string;
    accountUsername?: string;
    tenantId?: number | string;
    ip?: string;
    userAgent?: string;
    requestId?: string;
    targetType?: string;
    targetId?: string | number;
    details?: Record<string, unknown>;
}
export declare class AuditService {
    private readonly client?;
    private readonly logger;
    constructor(client?: IEventClient);
    log(entry: AuditEntry): void;
}
```

## dist\common\auth-client\account.strategy.d.ts

```typescript
import { ConfigService } from '@nestjs/config';
import { AuthClientService } from './auth-client.service';
declare const AccountStrategy_base: new (...args: any) => any;
export declare class AccountStrategy extends AccountStrategy_base {
    private readonly authClientService;
    constructor(configService: ConfigService, authClientService: AuthClientService);
    validate({ id, type, key }: {
        id: number | string;
        type: string;
        key?: string;
    }): Promise<import("./auth-client.interfaces").AccountInfo>;
}
export {};
```

## dist\common\auth-client\auth-client.interfaces.d.ts

```typescript
export { AccountInfo } from '../access.type';
```

## dist\common\auth-client\auth-client.module.d.ts

```typescript
import { DynamicModule } from '@nestjs/common';
export declare class AuthClientModule {
    static forRoot(): DynamicModule;
}
```

## dist\common\auth-client\auth-client.service.d.ts

```typescript
import { ConfigService } from '@nestjs/config';
import { AccountInfo } from './auth-client.interfaces';
export declare class AuthClientService {
    private readonly configService;
    private readonly logger;
    private readonly baseUrl;
    private readonly internalKey;
    private cache;
    private readonly defaultTtl;
    private readonly maxEntries;
    constructor(configService: ConfigService);
    getAccountInfo(id: number): Promise<AccountInfo | null>;
    clearCache(id?: number): void;
    private evictStale;
}
```

## dist\common\auth-client\index.d.ts

```typescript
export * from './auth-client.interfaces';
export * from './auth-client.service';
export * from './account.strategy';
export * from './auth-client.module';
```

## dist\common\auth.decorator.d.ts

```typescript
declare const JwtPublicGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class JwtPublicGuard extends JwtPublicGuard_base {
    handleRequest(_: any, user: any): any;
}
declare const JwtRequiredGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class JwtRequiredGuard extends JwtRequiredGuard_base {
    handleRequest(err: any, user: any): any;
}
declare const JwtAdminGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class JwtAdminGuard extends JwtAdminGuard_base {
    handleRequest(err: any, user: any): any;
}
export declare const Account: (apiType?: string) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
export declare const Self: (...dataOrPipes: unknown[]) => ParameterDecorator;
export {};
```

## dist\common\bootstrap\bootstrap.service.d.ts

```typescript
import { NestExpressApplication } from '@nestjs/platform-express';
export interface BootstrapOptions {
    port?: number | string;
    ip?: string;
    trustProxy?: boolean | number | string;
}
export declare function bootstrap(app: NestExpressApplication, options?: BootstrapOptions): Promise<void>;
```

## dist\common\bootstrap\setup\cookie-parser.d.ts

```typescript
export declare const CookieParser: {
    setup(app: any): void;
};
```

## dist\common\bootstrap\setup\cors.d.ts

```typescript
export interface CorsSetupOptions {
    origins?: string[];
    credentials?: boolean;
}
export declare const Cors: {
    setup(app: any, opts?: boolean | CorsSetupOptions): void;
};
```

## dist\common\bootstrap\setup\helmet.d.ts

```typescript
export declare const Helmet: {
    setup(app: any, opts?: Record<string, any>): void;
};
```

## dist\common\bootstrap\setup\index.d.ts

```typescript
export { Sentry } from './sentry';
export { Helmet } from './helmet';
export { Morgan } from './morgan';
export { Cors } from './cors';
export { CookieParser } from './cookie-parser';
export { Passport } from './passport';
export { Swagger } from './swagger';
export { ValidationPipe } from './validation-pipe';
export { Log } from './log';
export { Prefix } from './prefix';
```

## dist\common\bootstrap\setup\log.d.ts

```typescript
export declare const Log: {
    setup(app: any, opts?: {
        serviceName?: string;
    }): void;
};
```

## dist\common\bootstrap\setup\morgan.d.ts

```typescript
export declare const Morgan: {
    setup(app: any, opts?: {
        format?: string;
    }): void;
};
```

## dist\common\bootstrap\setup\passport.d.ts

```typescript
export declare const Passport: {
    setup(app: any): void;
};
```

## dist\common\bootstrap\setup\prefix.d.ts

```typescript
export declare const Prefix: {
    setup(app: any): void;
};
```

## dist\common\bootstrap\setup\sentry.d.ts

```typescript
export declare const Sentry: {
    setup(_app: any, opts?: {
        dsn?: string;
        environment?: string;
    }): void;
};
```

## dist\common\bootstrap\setup\swagger.d.ts

```typescript
export declare const Swagger: {
    setup(app: any): void;
};
```

## dist\common\bootstrap\setup\validation-pipe.d.ts

```typescript
export declare const ValidationPipe: {
    setup(app: any, opts?: {
        transform?: boolean;
        whitelist?: boolean;
        forbidNonWhitelisted?: boolean;
    }): void;
};
```

## dist\common\client\event-client.interfaces.d.ts

```typescript
export interface PublishOptions {
    source?: string;
    broadcast?: boolean;
    priority?: "low" | "normal" | "high";
    delay?: number;
    log?: boolean;
    ttl?: number;
    manager?: import("typeorm").EntityManager;
}
export declare abstract class IEventClient {
    abstract publish(pattern: string, payload: Record<string, unknown>, options?: PublishOptions): Promise<void>;
}
```

## dist\common\client\event-client.module.d.ts

```typescript
export declare class EventClientModule {
}
```

## dist\common\client\event-client.service.d.ts

```typescript
import { ConfigService } from "@nestjs/config";
import { IEventClient, PublishOptions } from "./event-client.interfaces";
export declare class HttpEventClient extends IEventClient {
    private readonly config;
    private readonly logger;
    private readonly eventServerUrl;
    private readonly apiKey;
    private readonly serviceName;
    constructor(config: ConfigService);
    publish(pattern: string, payload: Record<string, unknown>, options?: PublishOptions): Promise<void>;
}
```

## dist\common\client\outbox-client.service.d.ts

```typescript
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { IEventClient, PublishOptions } from './event-client.interfaces';
import { EventOutboxEntity } from './outbox.entity';
export declare class OutboxEventClient extends IEventClient {
    private readonly repo;
    private readonly logger;
    private readonly serviceName;
    constructor(repo: Repository<EventOutboxEntity>, config: ConfigService);
    publish(pattern: string, payload: Record<string, unknown>, options?: PublishOptions): Promise<void>;
}
```

## dist\common\client\outbox-relay.service.d.ts

```typescript
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { QueueWorker } from '../queue/queue-worker.service';
import { EventOutboxEntity } from './outbox.entity';
export declare class OutboxRelayWorker extends QueueWorker<EventOutboxEntity> {
    private readonly eventServerUrl;
    private readonly apiKey;
    private readonly httpTimeout;
    constructor(repo: Repository<EventOutboxEntity>, config: ConfigService);
    protected process(job: EventOutboxEntity): Promise<void>;
}
```

## dist\common\client\outbox.entity.d.ts

```typescript
import { QueueJobEntity } from '../queue/queue-job.entity';
export interface OutboxOptions {
    broadcast?: boolean;
    priority?: 'low' | 'normal' | 'high';
    delay?: number;
    log?: boolean;
    ttl?: number;
}
export declare class EventOutboxEntity extends QueueJobEntity {
    pattern: string;
    payload: Record<string, unknown>;
    source: string | null;
    opts: OutboxOptions | null;
}
export declare const OUTBOX_REPOSITORY = "OUTBOX_REPOSITORY";
```

## dist\common\client\outbox.envelope.d.ts

```typescript
import { OutboxOptions } from './outbox.entity';
export declare function buildEventEnvelope(pattern: string, payload: Record<string, unknown>, source: string | null | undefined, opts: OutboxOptions | null | undefined): Record<string, unknown>;
```

## dist\common\client\outbox.module.d.ts

```typescript
import { DynamicModule } from '@nestjs/common';
import { EventOutboxEntity } from './outbox.entity';
export declare class OutboxModule {
    static forRoot(entity: typeof EventOutboxEntity): DynamicModule;
}
```

## dist\common\column\bigint.column.d.ts

```typescript
export declare function BigIntColumn(name: any, value?: number, options?: any): PropertyDecorator;
```

## dist\common\column\boolean.column.d.ts

```typescript
export declare function BooleanColumn(name: any, value?: boolean, options?: any): PropertyDecorator;
```

## dist\common\column\created.column.d.ts

```typescript
export declare function CreatedColumn(name?: string, options?: any): PropertyDecorator;
```

## dist\common\column\date.column.d.ts

```typescript
export declare function DateColumn(name: any, options?: any): PropertyDecorator;
```

## dist\common\column\dto.column.d.ts

```typescript
export declare function DtoColumn(description?: string, options?: any): PropertyDecorator;
```

## dist\common\column\dto_created.column.d.ts

```typescript
export declare function DtoCreatedColumn(): PropertyDecorator;
```

## dist\common\column\dto_enum.column.d.ts

```typescript
export declare function DtoEnumColumn(description: any, value: any, defaultValue?: any, options?: any): PropertyDecorator;
```

## dist\common\column\dto_json.column.d.ts

```typescript
export declare function DtoJsonColumn(description: any, options?: any): PropertyDecorator;
```

## dist\common\column\dto_updated.column.d.ts

```typescript
export declare function DtoUpdatedColumn(): PropertyDecorator;
```

## dist\common\column\enum.column.d.ts

```typescript
export declare function EnumColumn(name: any, value: any, defaultValue?: any, options?: any): PropertyDecorator;
```

## dist\common\column\float.column.d.ts

```typescript
export declare function FloatColumn(name: any, value?: number, options?: any): PropertyDecorator;
```

## dist\common\column\id.column.d.ts

```typescript
type IdTypes = 'int' | 'bigint';
export declare function IdColumn(type?: IdTypes, comment?: any): PropertyDecorator;
export {};
```

## dist\common\column\indexed.column.d.ts

```typescript
export declare function IndexedColumn(index?: any): PropertyDecorator | undefined;
```

## dist\common\column\int.column.d.ts

```typescript
export declare function IntColumn(name: any, value?: number, options?: any): PropertyDecorator;
```

## dist\common\column\json.column.d.ts

```typescript
export declare function JsonColumn(name: any, options?: any): PropertyDecorator;
```

## dist\common\column\position_asc.column.d.ts

```typescript
export declare function PositionAscColumn(name?: string, options?: any): PropertyDecorator;
```

## dist\common\column\position_desc.column.d.ts

```typescript
export declare function PositionDescColumn(name?: string, options?: any): PropertyDecorator;
```

## dist\common\column\smallint.column.d.ts

```typescript
export declare function SmallIntColumn(name: any, value?: number, options?: any): PropertyDecorator;
```

## dist\common\column\text.column.d.ts

```typescript
export declare function TextColumn(name: any, options?: any): PropertyDecorator;
```

## dist\common\column\updated.column.d.ts

```typescript
export declare function UpdatedColumn(name?: string, options?: any): PropertyDecorator;
```

## dist\common\column\varchar.column.d.ts

```typescript
export declare function VarcharColumn(name: any, length?: number | string, options?: any): PropertyDecorator;
```

## dist\common\common.column.d.ts

```typescript
import { BigIntColumn } from './column/bigint.column';
import { BooleanColumn } from './column/boolean.column';
import { CreatedColumn } from './column/created.column';
import { DateColumn } from './column/date.column';
import { DtoColumn } from './column/dto.column';
import { DtoCreatedColumn } from './column/dto_created.column';
import { DtoEnumColumn } from './column/dto_enum.column';
import { DtoJsonColumn } from './column/dto_json.column';
import { DtoUpdatedColumn } from './column/dto_updated.column';
import { EnumColumn } from './column/enum.column';
import { FloatColumn } from './column/float.column';
import { IdColumn } from './column/id.column';
import { IntColumn } from './column/int.column';
import { JsonColumn } from './column/json.column';
import { PositionAscColumn } from './column/position_asc.column';
import { PositionDescColumn } from './column/position_desc.column';
import { SmallIntColumn } from './column/smallint.column';
import { TextColumn } from './column/text.column';
import { UpdatedColumn } from './column/updated.column';
import { VarcharColumn } from './column/varchar.column';
export { BigIntColumn, BooleanColumn, CreatedColumn, DateColumn, DtoColumn, DtoCreatedColumn, DtoEnumColumn, DtoJsonColumn, DtoUpdatedColumn, EnumColumn, FloatColumn, IdColumn, IntColumn, JsonColumn, PositionAscColumn, PositionDescColumn, SmallIntColumn, TextColumn, UpdatedColumn, VarcharColumn, };
```

## dist\common\common.decorator.d.ts

```typescript
export declare const Data: (...dataOrPipes: any[]) => ParameterDecorator;
export declare const ApiKey: () => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
export declare const Doc: (type: any, classDto: any) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
```

## dist\common\common.doc.d.ts

```typescript
export declare const CommonDoc: ({ title, models, success, relations, queries, params, }: {
    title: any;
    models?: any;
    success?: any;
    relations?: boolean;
    queries?: any;
    params?: any;
}) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
```

## dist\common\common.dto.d.ts

```typescript
export declare class CommonDto {
    id?: number;
}
```

## dist\common\common.enum.d.ts

```typescript
export declare enum TypeClients {
    DEFAULT = "public",
    CONFIDENTIAL = "confidential"
}
export declare enum TypeGenders {
    DEFAULT = "",
    MAN = "m",
    WOMAN = "w"
}
export declare enum TypeGrants {
    PASSWORD = "password",
    REFRESH_TOKEN = "refresh_token",
    AUTHORIZATION_CODE = "authorization_code",
    CLIENT_CREDENTIALS = "client_credentials",
    KEY = "key"
}
export declare enum TypeResponses {
    TOKEN = "token",
    CODE = "code"
}
export declare enum TypeValues {
    DEFAULT = "",
    BOOLEAN = "boolean",
    JSON = "json",
    NUMBER = "number",
    STRING = "string"
}
```

## dist\common\common.service.d.ts

```typescript
import { BaseEntity, DeepPartial, EntityManager, Repository } from 'typeorm';
import { RelationsDto } from './dto/relations.dto';
import { CommonDto } from './common.dto';
import { FindDto } from './dto/find.dto';
import { FindManyDto } from './dto/find_many.dto';
import { FindOneDto } from './dto/find_one.dto';
import { BindDto } from './dto/bind.dto';
export declare class CommonService<Dto extends CommonDto, Entity extends BaseEntity> {
    protected readonly repository: Repository<Entity>;
    protected getRepository(): Repository<Entity>;
    find(find?: FindDto, bind?: BindDto, opts?: {
        includeDeleted?: boolean;
    }): Promise<Entity[]>;
    findFirst(find: FindDto, bind?: BindDto): Promise<Entity>;
    findMany(findMany: FindManyDto, bind?: BindDto): Promise<Entity[]>;
    findOne(findOne: FindOneDto, bind?: BindDto, opts?: {
        includeDeleted?: boolean;
    }): Promise<Entity>;
    count(find: FindDto, bind?: BindDto): Promise<number>;
    countDistinct(field: string, find: FindDto): Promise<number>;
    protected persistCreate(entity: DeepPartial<any>, bind: BindDto, manager: EntityManager): Promise<any>;
    protected persistUpdate(entity: DeepPartial<any>, bind: BindDto, manager: EntityManager): Promise<any>;
    create(dto: Dto, relations?: Array<RelationsDto>, bind?: BindDto, externalManager?: EntityManager): Promise<Entity>;
    createEntity(entity: DeepPartial<any>, manager?: EntityManager): Promise<any>;
    normalizeId(id: number | string): any;
    update(id: number | string, dto: Dto, relations?: Array<RelationsDto>, bind?: BindDto, externalManager?: EntityManager): Promise<Entity>;
    updateEntity(entity: DeepPartial<any>, manager?: EntityManager): Promise<any>;
    getIdType(): string;
    private bindCriteria;
    private existsInScope;
    remove(id: number | string, bind?: BindDto, externalManager?: EntityManager): Promise<boolean>;
    hardDelete(id: number | string, bind?: BindDto, externalManager?: EntityManager): Promise<boolean>;
    restore(id: number | string, bind?: BindDto): Promise<boolean>;
    upsert(dto: Dto, relations?: Array<RelationsDto>, bind?: BindDto): Promise<Entity>;
    sortPosition(field: string, find: FindDto, bind?: BindDto): Promise<boolean>;
    movePosition(id: number | string, field: string, position: number, bind?: BindDto): Promise<boolean>;
    getUniqueColumns(): Array<string[]>;
    findUniqueEntry(entity: DeepPartial<any>, bind?: BindDto): Promise<any>;
    findUniqueEntrie(entity: DeepPartial<any>): Promise<any>;
    bind(entrie: any, data: any): BindDto;
    error(e: any): void;
}
```

## dist\common\db\migrations-lock.d.ts

```typescript
import { DataSourceOptions, Migration } from "typeorm";
export declare const MIGRATION_LOCK_KEY = 827261001;
export declare const runMigrationsUnderLock: (option: DataSourceOptions, lockKey?: number) => Promise<Migration[]>;
```

## dist\common\decorator\access.decorator.d.ts

```typescript
import { AccessRule } from '../access.rules';
export declare function accessDecorators(rules: AccessRule[]): MethodDecorator[];
export declare const Access: (rules: AccessRule[]) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
```

## dist\common\decorator\create-only.decorator.d.ts

```typescript
export declare const CREATE_ONLY_METADATA = "toolkit:create-only";
export declare function CreateOnly(): PropertyDecorator;
export declare function createOnlyFieldsOf(dto: object): string[];
export declare const stripCreateOnlyFields: (entity: any, dto: object) => void;
```

## dist\common\decorator\soft-delete.decorator.d.ts

```typescript
export declare const SOFT_DELETE_METADATA = "softDelete";
export declare function SoftDelete(): PropertyDecorator;
```

## dist\common\doc\count.doc.d.ts

```typescript
export declare const CountDoc: (classDto: any) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
```

## dist\common\doc\create.doc.d.ts

```typescript
export declare const CreateDoc: (classDto: any) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
```

## dist\common\doc\find.doc.d.ts

```typescript
export declare const FindDoc: (classDto: any) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
```

## dist\common\doc\find_first.doc.d.ts

```typescript
export declare const FindFirstDoc: (classDto: any) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
```

## dist\common\doc\find_many.doc.d.ts

```typescript
export declare const FindManyDoc: (classDto: any) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
```

## dist\common\doc\find_one.doc.d.ts

```typescript
export declare const FindOneDoc: (classDto: any) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
```

## dist\common\doc\position_move.doc.d.ts

```typescript
export declare const MovePositionDoc: () => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
```

## dist\common\doc\position_sort.doc.d.ts

```typescript
export declare const SortPositionDoc: (classDto: any) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
```

## dist\common\doc\remove.doc.d.ts

```typescript
export declare const RemoveDoc: () => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
```

## dist\common\doc\self.doc.d.ts

```typescript
export declare const SelfDoc: (classDto: any) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
```

## dist\common\doc\update.doc.d.ts

```typescript
export declare const UpdateDoc: (classDto: any) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
```

## dist\common\dto\bind.dto.d.ts

```typescript
export declare class BindDto {
    id?: number | string;
    name?: string;
    key?: string;
    allow?: boolean;
    tenantId?: number | string;
    tenantKey?: string;
    tenantName?: string;
    roles?: string[];
    filter?: Record<string, unknown>;
}
```

## dist\common\dto\find.dto.d.ts

```typescript
import { DeepPartial, FindOptionsOrder, FindOptionsSelect, FindOptionsWhere } from 'typeorm';
import { RelationsDto } from '../dto/relations.dto';
export declare class FindDto {
    select?: FindOptionsSelect<any>;
    where?: FindOptionsWhere<any>;
    search?: DeepPartial<any>;
    order?: FindOptionsOrder<any>;
    limit?: number;
    offset?: number;
    relations?: Array<RelationsDto>;
    join?: boolean;
}
```

## dist\common\dto\find_many.dto.d.ts

```typescript
import { FindDto } from './find.dto';
export declare class FindManyDto extends FindDto {
    ids: Array<number | string>;
}
```

## dist\common\dto\find_one.dto.d.ts

```typescript
import { FindDto } from './find.dto';
export declare class FindOneDto extends FindDto {
    id: number | string;
}
```

## dist\common\dto\relations.dto.d.ts

```typescript
export declare class RelationsDto {
    name?: string;
    order?: string;
    desc?: boolean;
}
```

## dist\common\entity.controller.d.ts

```typescript
import { Type } from '@nestjs/common';
import { BaseEntity } from 'typeorm';
import { RelationsDto } from './dto/relations.dto';
import { CommonService } from './common.service';
import { CommonDto } from './common.dto';
import { AccountInfo } from './access.type';
import { AccessRule, FieldRule, OperationName } from './access.rules';
export interface EntityControllerOptions {
    name: string;
    dto: Type<CommonDto>;
    entity: Type<unknown>;
    relations?: string[];
    operations?: Partial<Record<OperationName, AccessRule[]>>;
    fields?: Record<string, FieldRule>;
}
export declare const EntityController: (options: EntityControllerOptions) => {
    new <Dto extends CommonDto, Entity extends BaseEntity, Service extends CommonService<Dto, Entity>>(): {
        readonly service: Service;
        self(select: object, where: object, order: object, relations: Array<RelationsDto>, account: AccountInfo): Promise<Entity[]>;
        find(search: object, select: object, where: object, order: object, limit: number, offset: number, relations: Array<RelationsDto>, join: boolean, account: AccountInfo): Promise<Entity[]>;
        findFirst(search: object, select: object, where: object, order: object, relations: Array<RelationsDto>, account: AccountInfo): Promise<Entity>;
        findMany(ids: Array<string>, select: object, relations: Array<RelationsDto>, account: AccountInfo): Promise<Entity[]>;
        findOne(id: string, select: object, relations: Array<RelationsDto>, account: AccountInfo): Promise<Entity>;
        count(search: object, where: object, limit: number, offset: number, relations: Array<RelationsDto>, account: AccountInfo): Promise<number>;
        create(dto: Dto, relations: Array<RelationsDto>, account: AccountInfo): Promise<Entity>;
        update(id: string, dto: Dto, relations: Array<RelationsDto>, account: AccountInfo): Promise<Entity>;
        remove(id: string, account: AccountInfo): Promise<boolean>;
        hardDelete(id: string, account: AccountInfo): Promise<boolean>;
        restore(id: string, account: AccountInfo): Promise<boolean>;
        sortPosition(field: string, select: object, where: object, order: object, limit: number, offset: number, relations: Array<RelationsDto>, account: AccountInfo): Promise<boolean>;
        movePosition(id: string, field: string, position: number, account: AccountInfo): Promise<boolean>;
    };
};
```

## dist\common\guard\access.guard.d.ts

```typescript
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuditService } from '../audit/audit.service';
export declare const ACCESS_RULES_METADATA = "access-rules";
export declare class AccessGuard implements CanActivate {
    private readonly reflector;
    private readonly audit?;
    constructor(reflector: Reflector, audit?: AuditService);
    canActivate(context: ExecutionContext): boolean;
}
```

## dist\common\guard\api-key.guard.d.ts

```typescript
import { CanActivate, ExecutionContext } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
export declare class ApiKeyGuard implements CanActivate {
    private readonly config;
    constructor(config: ConfigService);
    canActivate(context: ExecutionContext): boolean;
}
```

## dist\common\guard\event-delivery.guard.d.ts

```typescript
import { CanActivate, ExecutionContext } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
export declare class EventDeliveryGuard implements CanActivate {
    private readonly config;
    constructor(config: ConfigService);
    canActivate(context: ExecutionContext): boolean;
}
```

## dist\common\guard\internal-auth.guard.d.ts

```typescript
import { CanActivate, ExecutionContext } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
export declare class InternalAuthGuard implements CanActivate {
    private readonly config;
    constructor(config: ConfigService);
    canActivate(context: ExecutionContext): boolean;
}
```

## dist\common\health\health.controller.d.ts

```typescript
export declare const HEALTH_SERVICE_NAME = "HEALTH_SERVICE_NAME";
export declare class HealthController {
    private readonly serviceName;
    constructor(serviceName: string);
    health(): {
        status: string;
        timestamp: string;
        service: string;
    };
}
```

## dist\common\health\health.module.d.ts

```typescript
import { DynamicModule } from '@nestjs/common';
export declare class HealthModule {
    static forRoot(serviceName: string): DynamicModule;
}
```

## dist\common\helper\array.helper.d.ts

```typescript
export declare const arrayWrap: <T>(value: T | T[]) => T[];
export declare const arrayUnwrap: <T>(value: T | T[]) => T;
```

## dist\common\helper\http.helper.d.ts

```typescript
export interface HttpOptions {
    headers?: Record<string, string>;
    timeout?: number;
    raw?: boolean;
    redirect?: RequestRedirect;
}
export interface HttpResponse<T = unknown> {
    status: number;
    data: T;
    ok: boolean;
    headers?: Record<string, string>;
}
export declare class HttpError extends Error {
    readonly status: number;
    readonly data: unknown;
    constructor(status: number, data: unknown, message?: string);
}
export declare function httpPost<T = unknown>(url: string, body?: unknown, options?: HttpOptions): Promise<HttpResponse<T>>;
export declare function httpGet<T = unknown>(url: string, options?: HttpOptions): Promise<HttpResponse<T>>;
```

## dist\common\helper\ip.helper.d.ts

```typescript
export declare function getClientIp(request: any): string | undefined;
```

## dist\common\helper\object.helper.d.ts

```typescript
export declare const except: <T extends object, K extends keyof T>(obj: T, keys: K[] | K) => Omit<T, K>;
export declare const only: <T extends object, K extends keyof T>(obj: T, keys: K[] | K) => Pick<T, K>;
type MappingValue<S, _T> = {
    sourceKey: keyof S;
    transform?: (value: unknown) => unknown;
} | keyof S;
export declare const setIfFilled: <T extends object, S extends object = T>(target: T, source: S, mapping?: Record<keyof T, MappingValue<S, T>> | (keyof T)[] | keyof T) => void;
export {};
```

## dist\common\helper\random.helper.d.ts

```typescript
export declare const randomInt: (min: number, max: number, step?: number) => number;
export declare const randomString: (min: number, max?: number, charset?: string) => string;
export declare const randomFromSet: (min: number, max?: number, ...setNames: string[]) => string;
export declare const randomNum: (min: number, max?: number) => string;
export declare const randomHex: (min: number, max?: number) => string;
export declare const randomBin: (min: number, max?: number) => string;
export declare const randomEmail: (min?: number, max?: number) => string;
export declare const randomOption: <T>(...args: T[]) => T;
export declare const shuffleArray: <T>(array: T[]) => T[];
export declare const randomArray: <T>(n: number, callback?: (i: number) => T) => T[];
export declare const randomNames: (words?: number) => Array<string | number>;
export declare const randomEnNames: (words?: number) => Array<string | number>;
export declare const randomRuNames: (words?: number) => Array<string | number>;
```

## dist\common\helper\scalar.helper.d.ts

```typescript
export declare const isFilled: (value: unknown) => boolean;
```

## dist\common\helper\string.helper.d.ts

```typescript
export declare const stripHtmlTags: (html: string) => string;
```

## dist\common\helper\webhook-signature.helper.d.ts

```typescript
export declare const WEBHOOK_SIGNATURE_HEADER = "x-event-signature";
export declare const WEBHOOK_TIMESTAMP_HEADER = "x-event-timestamp";
export declare const DEFAULT_TIMESTAMP_TOLERANCE_SECONDS = 300;
export declare const generateWebhookSecret: () => string;
export declare const signEventDelivery: (secret: string, timestamp: number, rawBody: string) => string;
export declare const verifyEventDelivery: (secret: string, rawBody: string, signature: string | undefined, timestamp: string | number | undefined, toleranceSeconds?: number) => boolean;
export type WebhookEgressMode = "internal" | "public" | "allowlist";
export interface WebhookEgressCheck {
    ok: boolean;
    reason?: string;
}
export declare const validateWebhookEgress: (url: string, mode?: WebhookEgressMode, allowlist?: string[]) => WebhookEgressCheck;
```

## dist\common\interceptor\add-client-ip.interceptor.d.ts

```typescript
import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
export declare class AddClientIpInterceptor implements NestInterceptor {
    private readonly key;
    constructor(key?: string);
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
}
```

## dist\common\interceptor\remove-private.interceptor.d.ts

```typescript
import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
export declare class RemovePrivateFieldsInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
}
```

## dist\common\logger\index.d.ts

```typescript
export { requestContextMiddleware, getRequestId, REQUEST_ID_HEADER } from './request.context';
export { JsonLogger } from './json.logger';
```

## dist\common\logger\json.logger.d.ts

```typescript
import { LoggerService } from '@nestjs/common';
export declare class JsonLogger implements LoggerService {
    log(message: any, context?: string): void;
    error(message: any, stackOrContext?: string, context?: string): void;
    warn(message: any, context?: string): void;
    debug?(message: any, context?: string): void;
    verbose?(message: any, context?: string): void;
    fatal?(message: any, stackOrContext?: string, context?: string): void;
    private emit;
}
```

## dist\common\logger\request.context.d.ts

```typescript
export declare const REQUEST_ID_HEADER = "x-request-id";
export declare function requestContextMiddleware(req: any, res: any, next: () => void): void;
export declare function getRequestId(): string | undefined;
```

## dist\common\metrics\metrics.controller.d.ts

```typescript
import { Response } from 'express';
import { MetricsService } from './metrics.service';
export declare class MetricsController {
    private readonly metrics;
    constructor(metrics: MetricsService);
    getMetrics(res: Response): Promise<void>;
}
```

## dist\common\metrics\metrics.interceptor.d.ts

```typescript
import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { MetricsService } from './metrics.service';
export declare class MetricsInterceptor implements NestInterceptor {
    private readonly metrics;
    constructor(metrics: MetricsService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
}
```

## dist\common\metrics\metrics.module.d.ts

```typescript
import { DynamicModule } from '@nestjs/common';
import { MetricsModuleOptions } from './metrics.service';
export declare class MetricsModule {
    static forRoot(options: MetricsModuleOptions): DynamicModule;
}
```

## dist\common\metrics\metrics.service.d.ts

```typescript
import { Counter, Gauge, Histogram, Registry } from 'prom-client';
export declare const METRICS_SERVICE_NAME = "METRICS_SERVICE_NAME";
export interface MetricsModuleOptions {
    service: string;
    defaultLabels?: Record<string, string>;
    defaultMetricsInterval?: number;
}
export declare class MetricsService {
    readonly registry: Registry<"text/plain; version=0.0.4; charset=utf-8">;
    readonly contentType: "text/plain; version=0.0.4; charset=utf-8";
    private readonly httpRequests;
    private readonly httpDuration;
    constructor(options: MetricsModuleOptions);
    observeHttp(method: string, route: string, status: number, durationSec: number): void;
    counter(name: string, help: string, labelNames?: string[]): Counter<string>;
    gauge(name: string, help: string, labelNames?: string[]): Gauge<string>;
    histogram(name: string, help: string, labelNames?: string[], buckets?: number[]): Histogram<string>;
    getMetrics(): Promise<string>;
}
```

## dist\common\permission.registry.d.ts

```typescript
import { EntityAccessConfig } from './access.rules';
export declare const PermissionRegistry: {
    set(entity: Function, config: EntityAccessConfig): void;
    get(entity: Function): EntityAccessConfig | undefined;
    getOwnerPath(entity: Function): string | undefined;
    has(entity: Function): boolean;
    delete(entity: Function): boolean;
    clear(): void;
    entries(): IterableIterator<[Function, EntityAccessConfig]>;
};
```

## dist\common\pipe\safe_id.pipe.d.ts

```typescript
import { PipeTransform } from '@nestjs/common';
export declare class SafeIdPipe implements PipeTransform<string, string> {
    transform(value: string): string;
}
```

## dist\common\queue\queue-job.entity.d.ts

```typescript
import { QueueStatus } from './queue.interfaces';
export declare abstract class QueueJobEntity {
    id: number;
    status: QueueStatus;
    attempts: number;
    lastAttemptAt: Date | null;
    nextAttemptAt: Date | null;
    errorMessage: string | null;
    createdAt: Date;
}
```

## dist\common\queue\queue-worker.service.d.ts

```typescript
import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { QueueJobEntity } from './queue-job.entity';
import { QueueWorkerConfig } from './queue.interfaces';
export declare abstract class QueueWorker<TJob extends QueueJobEntity> implements OnModuleInit, OnModuleDestroy {
    protected readonly repo: Repository<TJob>;
    protected readonly queueConfig: QueueWorkerConfig;
    private readonly logger;
    private workTimer;
    private cleanupTimer;
    private readonly maxInterval;
    private readonly staleTimeout;
    private currentDelay;
    private destroyed;
    constructor(repo: Repository<TJob>, queueConfig: QueueWorkerConfig);
    protected abstract process(job: TJob): Promise<void>;
    onModuleInit(): void;
    onModuleDestroy(): void;
    private scheduleNextCycle;
    private runCycle;
    private claimJobs;
    protected loadRelations(_qb: import('typeorm').SelectQueryBuilder<TJob>): void;
    private processBatch;
    private processJob;
    private handleFailure;
    protected formatError(error: Error): string;
    private runCleanup;
}
```

## dist\common\queue\queue.interfaces.d.ts

```typescript
export type QueueStatus = 'pending' | 'processing' | 'done' | 'failed';
export interface QueueWorkerConfig {
    interval: number;
    maxInterval?: number;
    batchSize: number;
    concurrency?: number;
    maxAttempts: number;
    retryDelay: number;
    staleTimeout?: number;
    cleanup?: QueueCleanupConfig;
}
export interface QueueCleanupConfig {
    interval: number;
    maxAgeDays: number;
    statuses?: QueueStatus[];
}
```

## dist\common\queue\queue.service.d.ts

```typescript
import { DeepPartial, Repository } from 'typeorm';
import { QueueJobEntity } from './queue-job.entity';
export declare abstract class QueueService<TJob extends QueueJobEntity> {
    protected readonly repo: Repository<TJob>;
    constructor(repo: Repository<TJob>);
    enqueue(data: DeepPartial<TJob>): Promise<TJob>;
    getStatus(id: number): Promise<TJob | null>;
}
```

## dist\common\service\admin.service.d.ts

```typescript
export declare function isSuperuser(user: {
    isSuperuser?: boolean;
} | undefined | null): boolean;
```

## dist\common\service\batch-loader.service.d.ts

```typescript
import { EntityManager, EntityMetadata } from 'typeorm';
export declare function batchLoadRelations(entities: any[], relationPaths: string[], metadata: EntityMetadata, manager: EntityManager): Promise<void>;
```

## dist\common\service\bind-path.service.d.ts

```typescript
export declare function buildNestedWhere(name: string, key: string, value: any): Record<string, any>;
```

## dist\common\service\bind-resolve.helper.d.ts

```typescript
import { EntityManager, EntityMetadata } from 'typeorm';
import { BindDto } from '../dto/bind.dto';
export declare function resolveBindRelationId(metadata: EntityMetadata, bind: BindDto, manager: EntityManager): Promise<number | string | null>;
export declare function resolveAutoAssign(metadata: EntityMetadata, bind: BindDto, manager: EntityManager): Promise<{
    name: string;
    id: number | string;
} | null>;
```

## dist\common\service\bind.service.d.ts

```typescript
import { BindDto } from '../dto/bind.dto';
export declare function bind(entrie: any, options: BindDto): BindDto;
```

## dist\common\service\capacity.helper.d.ts

```typescript
import { Repository } from 'typeorm';
export interface CapacityColumns {
    capacityColumn?: string;
    takenColumn?: string;
}
export declare const claimSlot: (repository: Repository<any>, candidateIds: Array<number | string>, columns?: CapacityColumns) => Promise<number | string | null>;
```

## dist\common\service\cookie.service.d.ts

```typescript
import { Request, Response } from 'express';
export declare class Cookie {
    private request;
    private response;
    constructor(request: Request, response: Response);
    set(name: string, data: string | number): void;
    setJson(name: string, data: unknown): void;
    get(name: string): any;
    getJson(name: string): any;
    reset(name: string): void;
}
```

## dist\common\service\crypt.service.d.ts

```typescript
export interface AesEnvelope {
    v?: number;
    encrypted: string;
    iv: string;
}
export declare function currentAesVersion(): number;
export declare function encrypt(data: any): Promise<AesEnvelope>;
export declare function decrypt(encryptedData: any, iv: any, version?: number): Promise<string>;
export declare function hash(data: any, type?: string): string;
```

## dist\common\service\delete.helper.d.ts

```typescript
import { Repository } from 'typeorm';
export declare function softRemove<Entity>(repo: Repository<Entity>, id: number | string, softDeleteCol: string, scopeWhere?: Record<string, any>): Promise<boolean>;
export declare function hardRemove<Entity>(repo: Repository<Entity>, id: number | string, scopeWhere?: Record<string, any>): Promise<boolean>;
export declare function restoreDeleted<Entity>(repo: Repository<Entity>, id: number | string, softDeleteCol: string, scopeWhere?: Record<string, any>): Promise<boolean>;
```

## dist\common\service\dynamic.save.service.d.ts

```typescript
export declare const parseDynamicSaveObject: (entity: any) => {};
```

## dist\common\service\dynamic.service.d.ts

```typescript
import { BaseEntity, DeepPartial, EntityManager, FindOptionsOrder, Repository } from 'typeorm';
import { CommonDto } from '../common.dto';
import { FindDto } from '../dto/find.dto';
import { CommonService } from '../common.service';
import { BindDto } from '../dto/bind.dto';
export declare class DynamicService<Dto extends CommonDto, Entity extends BaseEntity> extends CommonService<Dto, Entity> {
    protected readonly repository: Repository<any>;
    protected persistCreate(entity: DeepPartial<any>, _bind: BindDto, manager: EntityManager): Promise<any>;
    protected persistUpdate(entity: DeepPartial<any>, _bind: BindDto, manager: EntityManager): Promise<any>;
    createEntity(entity: DeepPartial<any>, manager?: EntityManager): Promise<any>;
    updateEntity(entity: DeepPartial<any>, manager?: EntityManager): Promise<any>;
    find(find: FindDto, bind?: BindDto): Promise<Entity[]>;
    protected getTableName(): string;
    protected fromToString(): string;
    protected limitToString(limit: number | string | undefined): string;
    protected offsetToString(offset: number | string | undefined): string;
    protected orderToString(order: FindOptionsOrder<any> | undefined): string;
    protected selectToString(select: any): string;
    protected whereToString(where: string[]): string;
    error(e: any): void;
}
```

## dist\common\service\dynamic.where.service.d.ts

```typescript
export declare const parseDynamicWhereObject: (where: any) => any[];
```

## dist\common\service\error.service.d.ts

```typescript
export declare function throwDbError(e: unknown): never;
```

## dist\common\service\escape.service.d.ts

```typescript
export declare const escapeQuotes: (string: any) => string;
export declare const escapeIdentifier: (string: any) => string;
```

## dist\common\service\find.helper.d.ts

```typescript
import { Repository } from 'typeorm';
import { BaseEntity } from 'typeorm';
import { BindDto } from '../dto/bind.dto';
import { FindDto } from '../dto/find.dto';
interface FindParams {
    where: any;
    relations?: string[];
    take?: number;
    skip?: number;
    select?: any;
    order?: any;
}
export interface BuildFindResult {
    where: any;
    relationNames: string[];
    useJoin: boolean;
    params: FindParams;
    isMultiHop: boolean;
}
export declare function buildFindWhere(bind: BindDto, find: FindDto, softDeleteCol?: string | null): BuildFindResult;
export declare function buildCountWhere(bind: BindDto, find: FindDto, softDeleteCol?: string | null): {
    where: any;
    relationNames: string[];
};
export declare function executeFind<Entity extends BaseEntity>(repository: Repository<Entity>, find: FindDto, bindResult: BuildFindResult, bind: BindDto): Promise<Entity[]>;
export {};
```

## dist\common\service\json.service.d.ts

```typescript
export declare const prepareJsonOrm: (value: any) => import("typeorm").FindOperator<any>;
```

## dist\common\service\like.service.d.ts

```typescript
export declare const prepareLike: () => "ILIKE" | "LIKE";
export declare const prepareLikeOrm: (value: string) => import("typeorm").FindOperator<string>;
```

## dist\common\service\nested_filter.service.d.ts

```typescript
import { BindDto } from '../dto/bind.dto';
export declare function filterNestedRelations(result: any[], bind: BindDto | undefined): void;
```

## dist\common\service\owner.service.d.ts

```typescript
export declare const OWNER_TABLE: string;
```

## dist\common\service\param_symbol.service.d.ts

```typescript
export declare const prepareParams: (object: Record<string, unknown>) => Record<string, string>;
```

## dist\common\service\position.helper.d.ts

```typescript
import { EntityManager, EntityMetadata, EntityTarget } from 'typeorm';
import { BindDto } from '../dto/bind.dto';
import { FindDto } from '../dto/find.dto';
export declare function validatePositionField(metadata: EntityMetadata, field: string): void;
export declare function executeSortPosition<Entity>(entityTarget: EntityTarget<Entity>, field: string, entries: any[], find: FindDto, bind: BindDto, metadata: EntityMetadata, manager: EntityManager): Promise<boolean>;
export declare function executeMovePosition<Entity>(entityTarget: EntityTarget<Entity>, id: number | string, field: string, _position: number, oldPosition: number, newPosition: number, manager: EntityManager, bind?: BindDto, metadata?: EntityMetadata): Promise<void>;
```

## dist\common\service\private_fields.service.d.ts

```typescript
import { BindDto } from '../dto/bind.dto';
export type FieldAccount = {
    roles?: string[];
    isSuperuser?: boolean;
} | BindDto | undefined | null;
export declare const removePrivateFields: (result: unknown | unknown[], account?: FieldAccount) => unknown | unknown[];
export declare const stripWriteFields: (dto: any, entityTarget: Function | string, bind?: BindDto, account?: FieldAccount) => void;
```

## dist\common\service\quotes.service.d.ts

```typescript
export declare const prepareQuotes: () => string;
```

## dist\common\service\relations.service.d.ts

```typescript
import { RelationsDto } from '../dto/relations.dto';
export declare const relationsOrder: (result: any, relations: Array<RelationsDto>) => any;
```

## dist\common\service\sanitize.service.d.ts

```typescript
import { EntityManager, EntityMetadata } from 'typeorm';
import { BindDto } from '../dto/bind.dto';
export declare function sanitizeForSave(entity: any, metadata: EntityMetadata, bind: BindDto | undefined, manager: EntityManager): Promise<void>;
```

## dist\common\service\search.service.d.ts

```typescript
import { FindOptionsWhere } from 'typeorm';
import { SearchType } from '../type/search.type';
export declare const buildSearchWhere: (search: SearchType) => FindOptionsWhere<any>[];
export declare const mergeSearchWhere: (baseWhere: any, searchWhere: any[]) => any;
export declare const searchService: (result: any, search: SearchType) => boolean;
```

## dist\common\service\soft-delete.service.d.ts

```typescript
export declare function getSoftDeleteColumn(entityTarget: any): string | undefined;
```

## dist\common\service\tenant-connection.manager.d.ts

```typescript
import { DataSource, DataSourceOptions } from 'typeorm';
export interface TenantConnectionManagerOptions {
    createConnection: (tenantId: string) => DataSourceOptions;
    maxPoolPerTenant?: number;
    maxTotalConnections?: number;
}
export declare class TenantConnectionManager {
    private static pool;
    private static options;
    private static accessOrder;
    static init(options: TenantConnectionManagerOptions): void;
    static get(tenantId: string): Promise<DataSource>;
    static close(tenantId: string): Promise<void>;
    static closeAll(): Promise<void>;
    static getSize(): number;
    private static touchAccess;
    private static evictOldest;
}
```

## dist\common\service\tenant-context.d.ts

```typescript
import { DataSource, QueryRunner } from 'typeorm';
export declare class TenantContext {
    private static storage;
    static run<T>(tenantId: string, fn: () => T): T;
    static getTenantId(): string | undefined;
    static setQueryRunner(qr: QueryRunner): void;
    static getQueryRunner(): QueryRunner | undefined;
    static setDataSource(ds: DataSource): void;
    static getDataSource(): DataSource | undefined;
}
```

## dist\common\service\tenant-strategy.d.ts

```typescript
export type TenantStrategy = 'where' | 'schema' | 'database';
export declare function getTenantStrategy(): TenantStrategy;
```

## dist\common\service\tenant.middleware.d.ts

```typescript
import { NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
export interface TenantMiddlewareOptions {
    strategy: 'schema' | 'database';
    schemaPrefix?: string;
}
export declare class TenantMiddleware implements NestMiddleware {
    private dataSource?;
    private options;
    constructor(options: TenantMiddlewareOptions, dataSource?: DataSource);
    use(req: any, res: Response, next: NextFunction): void;
    private handleSchema;
    private handleDatabase;
}
```

## dist\common\service\tenant.module.d.ts

```typescript
import { DynamicModule } from '@nestjs/common';
export interface TenantModuleOptions {
    strategy?: 'where' | 'schema' | 'database';
    schemaPrefix?: string;
    maxPoolPerTenant?: number;
    maxTotalConnections?: number;
    createConnection?: (tenantId: string) => any;
}
export declare class TenantModule {
    static forRoot(options?: TenantModuleOptions): DynamicModule;
}
```

## dist\common\service\tenant.service.d.ts

```typescript
export declare const TENANT_TABLE: string | undefined;
export declare const TENANT_FIELD: string;
```

## dist\common\service\tree.service.d.ts

```typescript
export declare function treeToFlat(data: object | object[]): Record<string, unknown> | Record<string, unknown>[];
export declare function flatToTree(data: Record<string, unknown> | Record<string, unknown>[]): object | object[];
```

## dist\common\service\unique.helper.d.ts

```typescript
import { EntityMetadata } from 'typeorm';
import { BindDto } from '../dto/bind.dto';
export declare function getUniqueColumns(metadata: EntityMetadata): Array<string[]>;
export declare function findUniqueEntry<_Entity>(repository: {
    metadata: EntityMetadata;
    findOne: (options: any) => Promise<any>;
}, entity: Record<string, any>, bind?: BindDto, softDeleteCol?: string | null): Promise<any>;
```

## dist\common\service\where.service.d.ts

```typescript
export declare const parseWhereObject: (where: Record<string, any>) => Record<string, any>;
```

## dist\common\service\write.helper.d.ts

```typescript
import { DeepPartial, EntityManager } from 'typeorm';
import { BindDto } from '../dto/bind.dto';
export declare function prepareAndCreate(entity: DeepPartial<any>, entityTarget: any, bind: BindDto, manager: EntityManager): Promise<any>;
export declare function prepareAndUpdate(entity: DeepPartial<any>, entityTarget: any, bind: BindDto, manager: EntityManager): Promise<void>;
```

## dist\common\type\api.type.d.ts

```typescript
export type ApiType = 'noBlock' | undefined;
```

## dist\common\type\search.type.d.ts

```typescript
export type SearchType = {
    fields: string[];
    terms: string[];
    method: 'and' | 'or' | undefined;
};
```

## dist\db.d.ts

```typescript
export * from './common/db/migrations-lock';
```

## dist\guard.d.ts

```typescript
export * from './common/guard/internal-auth.guard';
export * from './common/guard/access.guard';
export * from './common/guard/api-key.guard';
export * from './common/guard/event-delivery.guard';
```

## dist\health.d.ts

```typescript
export * from './common/health/health.module';
export * from './common/health/health.controller';
```

## dist\helper.d.ts

```typescript
export * from './common/helper/http.helper';
export * from './common/helper/webhook-signature.helper';
```

## dist\index.d.ts

```typescript
export { TenantScope } from './common/access.type';
export * from './common/access.type';
export * from './common/access.rules';
export * from './common/access.validator';
export * from './common/access.module';
export * from './common/auth.decorator';
export * from './common/common.column';
export * from './common/common.decorator';
export * from './common/common.doc';
export * from './common/common.dto';
export * from './common/common.enum';
export * from './common/common.service';
export * from './common/entity.controller';
export * from './common/permission.registry';
export * from './common/client/event-client.interfaces';
export * from './common/client/event-client.service';
export * from './common/client/event-client.module';
export * from './common/client/outbox.entity';
export * from './common/client/outbox.envelope';
export * from './common/client/outbox-client.service';
export * from './common/client/outbox-relay.service';
export * from './common/client/outbox.module';
export * from './common/audit/audit.service';
export * from './common/audit/audit.interceptor';
export * from './common/audit/audit.module';
export * from './common/column/bigint.column';
export * from './common/column/boolean.column';
export * from './common/column/created.column';
export * from './common/column/date.column';
export * from './common/column/dto.column';
export * from './common/column/dto_created.column';
export * from './common/column/dto_enum.column';
export * from './common/column/dto_json.column';
export * from './common/column/dto_updated.column';
export * from './common/column/enum.column';
export * from './common/column/float.column';
export * from './common/column/id.column';
export * from './common/column/indexed.column';
export * from './common/column/int.column';
export * from './common/column/json.column';
export * from './common/column/position_asc.column';
export * from './common/column/position_desc.column';
export * from './common/column/smallint.column';
export * from './common/column/text.column';
export * from './common/column/updated.column';
export * from './common/column/varchar.column';
export * from './common/decorator/access.decorator';
export * from './common/decorator/create-only.decorator';
export * from './common/decorator/soft-delete.decorator';
export * from './common/dto/bind.dto';
export * from './common/dto/find.dto';
export * from './common/dto/find_many.dto';
export * from './common/dto/find_one.dto';
export * from './common/dto/relations.dto';
export * from './common/doc/count.doc';
export * from './common/doc/create.doc';
export * from './common/doc/find.doc';
export * from './common/doc/find_first.doc';
export * from './common/doc/find_many.doc';
export * from './common/doc/find_one.doc';
export * from './common/doc/position_move.doc';
export * from './common/doc/position_sort.doc';
export * from './common/doc/remove.doc';
export * from './common/doc/self.doc';
export * from './common/doc/update.doc';
export * from './common/health/health.module';
export * from './common/health/health.controller';
export * from './common/logger/request.context';
export * from './common/logger/json.logger';
export * from './common/metrics/metrics.module';
export * from './common/metrics/metrics.controller';
export * from './common/metrics/metrics.interceptor';
export * from './common/metrics/metrics.service';
export * from './common/guard/internal-auth.guard';
export * from './common/guard/access.guard';
export * from './common/guard/api-key.guard';
export * from './common/helper/array.helper';
export * from './common/helper/http.helper';
export * from './common/helper/ip.helper';
export * from './common/helper/object.helper';
export * from './common/helper/scalar.helper';
export * from './common/helper/string.helper';
export * from './common/helper/random.helper';
export * from './common/helper/webhook-signature.helper';
export * from './common/interceptor/add-client-ip.interceptor';
export * from './common/interceptor/remove-private.interceptor';
export * from './common/pipe/safe_id.pipe';
export * from './common/queue/queue.interfaces';
export * from './common/queue/queue-job.entity';
export * from './common/queue/queue-worker.service';
export * from './common/queue/queue.service';
export * from './common/db/migrations-lock';
export * from './common/service/admin.service';
export * from './common/service/capacity.helper';
export * from './common/service/owner.service';
export * from './common/service/tenant.service';
export * from './common/service/tenant-strategy';
export * from './common/service/tenant-context';
export * from './common/service/tenant-connection.manager';
export * from './common/service/tenant.middleware';
export * from './common/service/tenant.module';
export * from './common/service/bind.service';
export * from './common/service/cookie.service';
export * from './common/service/crypt.service';
export * from './common/service/tree.service';
export * from './common/service/dynamic.save.service';
export * from './common/service/dynamic.service';
export * from './common/service/dynamic.where.service';
export * from './common/service/escape.service';
export * from './common/service/error.service';
export * from './common/service/soft-delete.service';
export * from './common/service/json.service';
export * from './common/service/like.service';
export * from './common/service/nested_filter.service';
export * from './common/service/param_symbol.service';
export * from './common/service/private_fields.service';
export * from './common/service/quotes.service';
export * from './common/service/relations.service';
export * from './common/service/sanitize.service';
export * from './common/service/search.service';
export * from './common/service/batch-loader.service';
export * from './common/service/where.service';
export * from './common/type/api.type';
export * from './common/type/search.type';
```

## dist\logger.d.ts

```typescript
export { requestContextMiddleware, getRequestId, REQUEST_ID_HEADER, JsonLogger } from './common/logger';
```

## dist\metrics.d.ts

```typescript
export * from './common/metrics/metrics.module';
export * from './common/metrics/metrics.controller';
export * from './common/metrics/metrics.interceptor';
export * from './common/metrics/metrics.service';
```
