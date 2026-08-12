# api-server-toolkit — Type Declarations

This file is auto-generated for AI-assisted development.
Feed it to your LLM (Claude, ChatGPT, etc.) to get framework-aware code without hallucinations.

Generated from 185 declaration files.

---

## dist\__tests__\__mocks__\cookie-parser.d.ts

```typescript

```

## dist\__tests__\__mocks__\morgan.d.ts

```typescript

```

## dist\__tests__\__mocks__\nestjs-passport.d.ts

```typescript
export declare function AuthGuard(...args: any[]): {
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

## dist\__tests__\access.type.spec.d.ts

```typescript
export {};
```

## dist\__tests__\add-client-ip.interceptor.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\array.helper.spec.d.ts

```typescript
export {};
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

## dist\__tests__\cookie.service.spec.d.ts

```typescript
export {};
```

## dist\__tests__\delete.helper.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\field-roles.spec.d.ts

```typescript
import 'reflect-metadata';
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

## dist\__tests__\nested_filter.service.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\object.helper.spec.d.ts

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

## dist\__tests__\remove-private.interceptor.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\resolve-bind.spec.d.ts

```typescript
export {};
```

## dist\__tests__\roles.decorator.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\roles.guard.spec.d.ts

```typescript
export {};
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

## dist\__tests__\secure.guard.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\simple.secure.guard.spec.d.ts

```typescript
import 'reflect-metadata';
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

## dist\__tests__\token-validate.spec.d.ts

```typescript
export {};
```

## dist\__tests__\tree.service.spec.d.ts

```typescript
import 'reflect-metadata';
```

## dist\__tests__\unique.helper.spec.d.ts

```typescript
import 'reflect-metadata';
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
```

## dist\common\access.type.d.ts

```typescript
import { Type } from '@nestjs/common';
import { CommonDto } from './common.dto';
export declare enum AccessLevel {
    PUBLIC = "public",
    ACCOUNT = "account",
    TENANT = "tenant",
    OWNER = "owner",
    SUPERUSER = "superuser",
    CLOSED = "closed"
}
export declare enum TenantScope {
    OWN = "own",
    ALL = "all"
}
export type RoleName = string;
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
export type OperationAccess = AccessLevel | {
    level: AccessLevel.OWNER;
    bindPath?: string;
};
export interface OperationConfig {
    create: OperationAccess;
    read: OperationAccess;
    update: OperationAccess;
    delete: OperationAccess;
}
export interface EntityPermissionConfig extends OperationConfig {
    accountTable?: string;
    accountField?: string;
    tenantTable?: string;
    tenantField?: string;
}
export type TenantScopeValue = TenantScope | string | string[];
export type RoleEntry = RoleName | {
    role: RoleName;
    tenant?: TenantScopeValue;
};
export declare function normalizeRoles(roles: RoleEntry[] | undefined): RoleName[];
export declare function resolveTenantScope(roleEntries: RoleEntry[] | undefined, matchedRoles?: string[]): TenantScope | undefined;
export interface EntityControllerOptions {
    name: string;
    dto: Type<CommonDto>;
    entity: Type<unknown>;
    accountTable?: string;
    accountField?: string;
    tenantTable?: string;
    tenantField?: string;
    operations?: Partial<OperationConfig>;
    roles?: Partial<Record<'create' | 'read' | 'update' | 'delete', RoleEntry[]>>;
    relations?: string[];
}
export declare function normalizeAccess(access: OperationAccess | undefined, fallback?: AccessLevel): AccessLevel;
export declare function getBindPath(access: OperationAccess | undefined, fallback: string): string | undefined;
```

## dist\common\auth-client\account.strategy.d.ts

```typescript
import { ConfigService } from '@nestjs/config';
import { AuthClientService } from './auth-client.service';
declare const AccountStrategy_base: new (...args: any) => any;
export declare class AccountStrategy extends AccountStrategy_base {
    private readonly configService;
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
    constructor(configService: ConfigService);
    getAccountInfo(id: number): Promise<AccountInfo | null>;
    clearCache(id?: number): void;
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
import { OperationAccess } from './access.type';
export declare function accessGuard(access: OperationAccess): MethodDecorator & ClassDecorator;
export declare const Account: (apiType?: string) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
export declare const Self: (...dataOrPipes: unknown[]) => ParameterDecorator;
```

## dist\common\bootstrap\bootstrap.service.d.ts

```typescript
import { NestExpressApplication } from '@nestjs/platform-express';
export interface BootstrapOptions {
    port?: number | string;
    ip?: string;
}
export declare function bootstrap(app: NestExpressApplication, options?: BootstrapOptions): Promise<void>;
```

## dist\common\bootstrap\bootstrap.type.d.ts

```typescript
import { Type } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
export interface BootstrapOptions {
    module: Type<unknown>;
    serviceName: string;
    port?: number | string;
    ip?: string;
    cors?: boolean | Record<string, unknown>;
    swagger?: boolean;
    morgan?: boolean;
    cookieParser?: boolean;
    passport?: boolean;
    transactional?: boolean;
    beforeListen?: (app: NestExpressApplication) => void | Promise<void>;
}
```

## dist\common\bootstrap\setup\cookie-parser.d.ts

```typescript
export declare const CookieParser: {
    setup(app: any): void;
};
```

## dist\common\bootstrap\setup\cors.d.ts

```typescript
export declare const Cors: {
    setup(app: any, opts?: boolean | Record<string, any>): void;
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
export { Telemetry } from './telemetry';
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
    setup(app: any, opts?: {
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

## dist\common\bootstrap\setup\telemetry.d.ts

```typescript
export interface TelemetryOptions {
    serviceName: string;
    otlpEndpoint?: string;
}
export declare const Telemetry: {
    setup(app: any, opts: TelemetryOptions): void;
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
export declare const Doc: (type: any, classDto: any) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
export declare const Secure: () => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
export declare const SimpleSecure: () => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
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
    find(find?: FindDto, bind?: BindDto): Promise<Entity[]>;
    findFirst(find: FindDto, bind?: BindDto): Promise<Entity>;
    findMany(findMany: FindManyDto, bind?: BindDto): Promise<Entity[]>;
    findOne(findOne: FindOneDto, bind?: BindDto): Promise<Entity>;
    count(find: FindDto, bind?: BindDto): Promise<number>;
    countDistinct(field: string, find: FindDto): Promise<number>;
    create(dto: Dto, relations?: Array<RelationsDto>, bind?: BindDto, externalManager?: EntityManager): Promise<Entity>;
    createEntity(entity: DeepPartial<any>, manager?: EntityManager): Promise<any>;
    update(id: number | string, dto: Dto, relations?: Array<RelationsDto>, bind?: BindDto, externalManager?: EntityManager): Promise<Entity>;
    updateEntity(entity: DeepPartial<any>, manager?: EntityManager): Promise<any>;
    getIdType(): string;
    remove(id: number | string, bind?: BindDto, externalManager?: EntityManager): Promise<boolean>;
    hardDelete(id: number | string, bind?: BindDto, externalManager?: EntityManager): Promise<boolean>;
    restore(id: number | string, bind?: BindDto): Promise<boolean>;
    upsert(dto: Dto, relations?: Array<RelationsDto>, bind?: BindDto): Promise<Entity>;
    sortPosition(field: string, find: FindDto, bind?: BindDto): Promise<boolean>;
    movePosition(id: number | string, field: string, position: number, bind?: BindDto): Promise<boolean>;
    getUniqueColumns(): Array<string[]>;
    findUniqueEntry(entity: DeepPartial<any>): Promise<any>;
    findUniqueEntrie(entity: DeepPartial<any>): Promise<any>;
    bind(entrie: any, data: any): BindDto;
    error(e: any): void;
}
```

## dist\common\decorator\field_access.decorator.d.ts

```typescript
import { AccessLevel } from '../access.type';
export interface FieldAccessOptions {
    read?: AccessLevel;
    write?: AccessLevel;
}
export declare const FIELD_ACCESS_METADATA = "fieldAccess";
export declare function FieldAccess(options: FieldAccessOptions): (target: any, propertyKey: string) => void;
```

## dist\common\decorator\field_roles.decorator.d.ts

```typescript
export interface FieldRolesOptions {
    read?: string[];
    write?: string[];
}
export declare const FIELD_ROLES_METADATA = "fieldRoles";
export declare function FieldRoles(options: FieldRolesOptions): (target: any, propertyKey: string) => void;
```

## dist\common\decorator\roles.decorator.d.ts

```typescript
export declare const Roles: (...roles: string[]) => import("@nestjs/common").CustomDecorator<string>;
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
import { TenantScope } from '../access.type';
export declare class BindDto {
    id?: number | string;
    name?: string;
    key?: string;
    allow?: boolean;
    tenantId?: number | string;
    tenantKey?: string;
    tenantName?: string;
    roles?: string[];
    tenantScope?: TenantScope;
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
import { BaseEntity } from 'typeorm';
import { RelationsDto } from './dto/relations.dto';
import { CommonService } from './common.service';
import { CommonDto } from './common.dto';
import { AccountInfo } from './access.type';
import { EntityControllerOptions, OperationAccess, TenantScope } from './access.type';
import { BindDto } from './dto/bind.dto';
export declare function matchedRoleNames(account: AccountInfo, requiredRoles: string[]): string[];
export declare function resolveTenantScopeFromAccount(account: AccountInfo, matchedRoles?: string[]): TenantScope | undefined;
export declare function resolveBind(access: OperationAccess, account: AccountInfo, accountTable: string, accountField: string, tenantTable?: string, tenantField?: string, hasRoles?: boolean, matchedRoles?: string[]): BindDto | undefined;
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

## dist\common\guard\roles.guard.d.ts

```typescript
import { CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
export declare const ROLES_METADATA = "roles";
export declare class RolesGuard implements CanActivate {
    private readonly reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
}
```

## dist\common\guard\secure.guard.d.ts

```typescript
import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class SecureGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
```

## dist\common\guard\secure.guard.service.d.ts

```typescript
export declare function tokenValidate(token: string): boolean;
export declare function tokenValidateSimple(token: string): boolean;
```

## dist\common\guard\simple.secure.guard.d.ts

```typescript
import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class SimpleSecureGuard implements CanActivate {
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
export declare function httpPost(url: string, body?: unknown, options?: HttpOptions): Promise<HttpResponse>;
export declare function httpGet(url: string, options?: HttpOptions): Promise<HttpResponse>;
```

## dist\common\helper\object.helper.d.ts

```typescript
export declare const except: <T extends object, K extends keyof T>(obj: T, keys: K[] | K) => Omit<T, K>;
export declare const only: <T extends object, K extends keyof T>(obj: T, keys: K[] | K) => Pick<T, K>;
type MappingValue<S, T> = {
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

## dist\common\permission.registry.d.ts

```typescript
import { EntityPermissionConfig, OperationAccess } from './access.type';
export declare const PermissionRegistry: {
    set(entity: Function, config: EntityPermissionConfig): void;
    get(entity: Function): EntityPermissionConfig | undefined;
    getAccountTable(entity: Function): string | undefined;
    getAccountField(entity: Function): string | undefined;
    getTenantTable(entity: Function): string | undefined;
    getTenantField(entity: Function): string | undefined;
    getCreate(entity: Function): OperationAccess;
    getRead(entity: Function): OperationAccess;
    getUpdate(entity: Function): OperationAccess;
    getDelete(entity: Function): OperationAccess;
    has(entity: Function): boolean;
    delete(entity: Function): boolean;
    clear(): void;
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
    protected loadRelations(qb: import('typeorm').SelectQueryBuilder<TJob>): void;
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
export declare function encrypt(data: any): Promise<{
    encrypted: string;
    iv: string;
}>;
export declare function decrypt(encryptedData: any, iv: any): Promise<string>;
export declare function hash(data: any, type?: string): string;
```

## dist\common\service\delete.helper.d.ts

```typescript
import { Repository } from 'typeorm';
export declare function softRemove<Entity>(repo: Repository<Entity>, id: number | string, softDeleteCol: string): Promise<boolean>;
export declare function hardRemove<Entity>(repo: Repository<Entity>, id: number | string): Promise<boolean>;
export declare function restoreDeleted<Entity>(repo: Repository<Entity>, id: number | string, softDeleteCol: string): Promise<boolean>;
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
export declare function executeMovePosition<Entity>(entityTarget: EntityTarget<Entity>, id: number | string, field: string, position: number, oldPosition: number, newPosition: number, manager: EntityManager): Promise<void>;
```

## dist\common\service\private_fields.service.d.ts

```typescript
import { BindDto } from '../dto/bind.dto';
export declare const removePrivateFields: (result: unknown | unknown[], bind: BindDto | undefined, account?: any) => unknown | unknown[];
export declare const stripWriteFields: (dto: any, entityTarget: Function | string, bind: BindDto | undefined, account?: any) => void;
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
    use(req: any, _res: Response, next: NextFunction): void;
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
export declare function getUniqueColumns(metadata: EntityMetadata): Array<string[]>;
export declare function findUniqueEntry<Entity>(repository: {
    metadata: EntityMetadata;
    findOne: (options: any) => Promise<any>;
}, entity: Record<string, any>): Promise<any>;
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

## dist\guard.d.ts

```typescript
export * from './common/guard/internal-auth.guard';
export * from './common/guard/roles.guard';
export * from './common/guard/secure.guard.service';
export * from './common/guard/secure.guard';
export * from './common/guard/simple.secure.guard';
```

## dist\health.d.ts

```typescript
export * from './common/health/health.module';
export * from './common/health/health.controller';
```

## dist\helper.d.ts

```typescript
export * from './common/helper/http.helper';
```

## dist\index.d.ts

```typescript
export { AccessLevel, TenantScope } from './common/access.type';
export * from './common/access.type';
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
export * from './common/decorator/field_access.decorator';
export * from './common/decorator/field_roles.decorator';
export * from './common/decorator/roles.decorator';
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
export * from './common/guard/internal-auth.guard';
export * from './common/guard/roles.guard';
export * from './common/guard/secure.guard.service';
export * from './common/guard/secure.guard';
export * from './common/guard/simple.secure.guard';
export * from './common/helper/array.helper';
export * from './common/helper/http.helper';
export * from './common/helper/object.helper';
export * from './common/helper/scalar.helper';
export * from './common/helper/string.helper';
export * from './common/helper/random.helper';
export * from './common/interceptor/add-client-ip.interceptor';
export * from './common/interceptor/remove-private.interceptor';
export * from './common/pipe/safe_id.pipe';
export * from './common/queue/queue.interfaces';
export * from './common/queue/queue-job.entity';
export * from './common/queue/queue-worker.service';
export * from './common/queue/queue.service';
export * from './common/service/admin.service';
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
