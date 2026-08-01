# api-server-toolkit — Type Declarations

This file is auto-generated for AI-assisted development.
Feed it to your LLM (Claude, ChatGPT, etc.) to get framework-aware code without hallucinations.

Generated from 92 declaration files.

---

## dist\client.d.ts

```typescript
export * from './common/client/event-client.interfaces';
export * from './common/client/event-client.service';
export * from './common/client/event-client.module';
```

## dist\common\access.type.d.ts

```typescript
import { Type } from '@nestjs/common';
export type AccessLevel = 'public' | 'account' | 'owner' | 'admin' | 'closed';
export interface AccountLike {
    id: number | string;
    username?: string;
    isActivated?: boolean;
    isSuperuser?: boolean;
}
export type OperationAccess = AccessLevel | {
    level: 'owner';
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
}
export interface EntityControllerOptions {
    name: string;
    dto: any;
    entity: Type<unknown>;
    accountTable?: string;
    accountField?: string;
    operations?: Partial<OperationConfig>;
    relations?: string[];
}
export declare function normalizeAccess(access: OperationAccess | undefined, fallback?: AccessLevel): AccessLevel;
export declare function getBindPath(access: OperationAccess | undefined, fallback: string): string | undefined;
```

## dist\common\auth.decorator.d.ts

```typescript
import { OperationAccess } from './access.type';
export declare function accessGuard(access: OperationAccess): MethodDecorator & ClassDecorator;
export declare const Account: (apiType?: string) => <TFunction extends Function, Y>(target: object | TFunction, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
export declare const Self: (...dataOrPipes: unknown[]) => ParameterDecorator;
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
    abstract publish(pattern: string, payload: Record<string, any>, options?: PublishOptions): Promise<void>;
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
    publish(pattern: string, payload: Record<string, any>, options?: PublishOptions): Promise<void>;
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
export declare const Doc: (type: any, classDto: any) => <TFunction extends Function, Y>(target: object | TFunction, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
export declare const Secure: () => <TFunction extends Function, Y>(target: object | TFunction, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
export declare const SimpleSecure: () => <TFunction extends Function, Y>(target: object | TFunction, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
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
}) => <TFunction extends Function, Y>(target: object | TFunction, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
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
    find(find?: FindDto, bind?: BindDto): Promise<Entity[]>;
    findFirst(find: FindDto, bind?: BindDto): Promise<Entity>;
    findMany(findMany: FindManyDto, bind?: BindDto): Promise<Entity[]>;
    findOne(findOne: FindOneDto, bind?: BindDto): Promise<Entity>;
    count(find: FindDto, bind?: BindDto): Promise<number>;
    countDistinct(field: string, find: FindDto): Promise<number>;
    create(dto: Dto, relations?: Array<RelationsDto>, bind?: BindDto): Promise<Entity>;
    createEntity(entity: DeepPartial<any>, manager?: EntityManager): Promise<any>;
    getUniqueColumns(): Array<string>;
    findUniqueEntrie(entity: DeepPartial<any>): Promise<any>;
    upsert(dto: Dto, relations?: Array<RelationsDto>, bind?: BindDto): Promise<Entity>;
    update(id: number | string, dto: Dto, relations?: Array<RelationsDto>, bind?: BindDto): Promise<Entity>;
    updateEntity(entity: DeepPartial<any>, manager?: EntityManager): Promise<any>;
    getIdType(): string;
    private resolveBindRelationId;
    private resolveAutoAssign;
    remove(id: number | string, bind?: BindDto): Promise<boolean>;
    sortPosition(field: string, find: FindDto, bind?: BindDto): Promise<boolean>;
    movePosition(id: number | string, field: string, position: number, bind?: BindDto): Promise<boolean>;
    bind(entrie: any, data: any): BindDto;
    private validatePositionField;
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

## dist\common\doc\count.doc.d.ts

```typescript
export declare const CountDoc: (classDto: any) => <TFunction extends Function, Y>(target: object | TFunction, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
```

## dist\common\doc\create.doc.d.ts

```typescript
export declare const CreateDoc: (classDto: any) => <TFunction extends Function, Y>(target: object | TFunction, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
```

## dist\common\doc\find.doc.d.ts

```typescript
export declare const FindDoc: (classDto: any) => <TFunction extends Function, Y>(target: object | TFunction, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
```

## dist\common\doc\find_first.doc.d.ts

```typescript
export declare const FindFirstDoc: (classDto: any) => <TFunction extends Function, Y>(target: object | TFunction, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
```

## dist\common\doc\find_many.doc.d.ts

```typescript
export declare const FindManyDoc: (classDto: any) => <TFunction extends Function, Y>(target: object | TFunction, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
```

## dist\common\doc\find_one.doc.d.ts

```typescript
export declare const FindOneDoc: (classDto: any) => <TFunction extends Function, Y>(target: object | TFunction, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
```

## dist\common\doc\position_move.doc.d.ts

```typescript
export declare const MovePositionDoc: () => <TFunction extends Function, Y>(target: object | TFunction, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
```

## dist\common\doc\position_sort.doc.d.ts

```typescript
export declare const SortPositionDoc: (classDto: any) => <TFunction extends Function, Y>(target: object | TFunction, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
```

## dist\common\doc\remove.doc.d.ts

```typescript
export declare const RemoveDoc: () => <TFunction extends Function, Y>(target: object | TFunction, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
```

## dist\common\doc\self.doc.d.ts

```typescript
export declare const SelfDoc: (classDto: any) => <TFunction extends Function, Y>(target: object | TFunction, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
```

## dist\common\doc\update.doc.d.ts

```typescript
export declare const UpdateDoc: (classDto: any) => <TFunction extends Function, Y>(target: object | TFunction, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
```

## dist\common\dto\bind.dto.d.ts

```typescript
export declare class BindDto {
    id?: number | string;
    name?: string;
    key?: string;
    allow?: boolean;
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
import { AccountLike } from './access.type';
import { EntityControllerOptions } from './access.type';
export declare const EntityController: (options: EntityControllerOptions) => {
    new <Dto extends CommonDto, Entity extends BaseEntity, Service extends CommonService<Dto, Entity>>(): {
        readonly service: Service;
        self(select: object, where: object, order: object, relations: Array<RelationsDto>, account: AccountLike): Promise<Entity[]>;
        find(search: object, select: object, where: object, order: object, limit: number, offset: number, relations: Array<RelationsDto>, account: AccountLike): Promise<Entity[]>;
        findFirst(search: object, select: object, where: object, order: object, relations: Array<RelationsDto>, account: AccountLike): Promise<Entity>;
        findMany(ids: Array<string>, select: object, relations: Array<RelationsDto>, account: AccountLike): Promise<Entity[]>;
        findOne(id: string, select: object, relations: Array<RelationsDto>, account: AccountLike): Promise<Entity>;
        count(search: object, where: object, limit: number, offset: number, relations: Array<RelationsDto>, account: AccountLike): Promise<number>;
        create(dto: Dto, relations: Array<RelationsDto>, account: AccountLike): Promise<Entity>;
        update(id: string, dto: Dto, relations: Array<RelationsDto>, account: AccountLike): Promise<Entity>;
        remove(id: string, account: AccountLike): Promise<boolean>;
        sortPosition(field: string, select: object, where: object, order: object, limit: number, offset: number, relations: Array<RelationsDto>, account: AccountLike): Promise<boolean>;
        movePosition(id: string, field: string, position: number, account: AccountLike): Promise<boolean>;
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
export interface HttpResponse<T = any> {
    status: number;
    data: T;
    ok: boolean;
}
export declare class HttpError extends Error {
    readonly status: number;
    readonly data: any;
    constructor(status: number, data: any, message?: string);
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
    transform?: (value: any) => any;
} | keyof S;
export declare const setIfFilled: <T extends object, S extends object = T>(target: T, source: S, mapping?: Record<keyof T, MappingValue<S, T>> | (keyof T)[] | keyof T) => void;
export {};
```

## dist\common\helper\scalar.helper.d.ts

```typescript
export declare const isFilled: (value: any) => boolean;
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
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
```

## dist\common\interceptor\remove-private.interceptor.d.ts

```typescript
import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
export declare class RemovePrivateFieldsInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
```

## dist\common\permission.registry.d.ts

```typescript
import { EntityPermissionConfig, OperationAccess } from './access.type';
export declare const PermissionRegistry: {
    set(entity: any, config: EntityPermissionConfig): void;
    get(entity: any): EntityPermissionConfig | undefined;
    getAccountTable(entity: any): string | undefined;
    getAccountField(entity: any): string | undefined;
    getCreate(entity: any): OperationAccess;
    getRead(entity: any): OperationAccess;
    getUpdate(entity: any): OperationAccess;
    getDelete(entity: any): OperationAccess;
    has(entity: any): boolean;
    delete(entity: any): boolean;
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

## dist\common\service\batch-loader.service.d.ts

```typescript
import { EntityManager } from 'typeorm';
export declare function batchLoadRelations(entities: any[], relationPaths: string[], metadata: any, manager: EntityManager): Promise<void>;
```

## dist\common\service\bind.service.d.ts

```typescript
import { BindDto } from '../dto/bind.dto';
export declare function bind(entrie: any, { allow, key, name }: BindDto): BindDto;
```

## dist\common\service\cookie.service.d.ts

```typescript
import { Request, Response } from 'express';
export declare class Cookie {
    private request;
    private response;
    constructor(request: Request, response: Response);
    set(name: string, data: string | number): void;
    setJson(name: string, data: any): void;
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

## dist\common\service\dynamic.save.service.d.ts

```typescript
export declare const parseDynamicSaveObject: (entity: any) => {};
```

## dist\common\service\dynamic.service.d.ts

```typescript
import { BaseEntity, DeepPartial, EntityManager, Repository } from 'typeorm';
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
    protected limitToString(limit: any): string;
    protected offsetToString(offset: any): string;
    protected orderToString(order: any): string;
    protected selectToString(select: any): string;
    protected whereToString(where: any): string;
    error(e: any): void;
}
```

## dist\common\service\dynamic.where.service.d.ts

```typescript
export declare const parseDynamicWhereObject: (where: any) => any[];
```

## dist\common\service\escape.service.d.ts

```typescript
export declare const escapeQuotes: (string: any) => string;
```

## dist\common\service\json.service.d.ts

```typescript
export declare const prepareJsonOrm: (value: any) => import("typeorm").FindOperator<any>;
```

## dist\common\service\like.service.d.ts

```typescript
export declare const prepareLike: () => "ILIKE" | "LIKE";
export declare const prepareLikeOrm: (value: any) => import("typeorm").FindOperator<any>;
```

## dist\common\service\nested_filter.service.d.ts

```typescript
export declare function filterNestedRelations(result: any[], bind: any): void;
```

## dist\common\service\param_symbol.service.d.ts

```typescript
export declare const prepareParams: (object: any) => {};
```

## dist\common\service\private_fields.service.d.ts

```typescript
export declare const removePrivateFields: (result: any | any[], bind: any) => any | any[];
export declare const stripWriteFields: (dto: any, entityTarget: any, bind: any) => void;
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
export declare function sanitizeForSave(entity: any, metadata: EntityMetadata, bind: any, manager: EntityManager): Promise<void>;
```

## dist\common\service\search.service.d.ts

```typescript
import { FindOptionsWhere } from 'typeorm';
import { SearchType } from '../type/search.type';
export declare const buildSearchWhere: (search: SearchType) => FindOptionsWhere<any>[];
export declare const mergeSearchWhere: (baseWhere: any, searchWhere: any[]) => any;
export declare const searchService: (result: any, search: SearchType) => boolean;
```

## dist\common\service\tree.service.d.ts

```typescript
export declare function treeToFlat(data: object | object[]): Record<string, any> | Record<string, any>[];
export declare function flatToTree(data: Record<string, any> | Record<string, any>[]): object | object[];
```

## dist\common\service\where.service.d.ts

```typescript
export declare const parseWhereObject: (where: any) => {};
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
export * from './common/guard/secure.guard.service';
export * from './common/guard/secure.guard';
export * from './common/guard/simple.secure.guard';
```

## dist\helper.d.ts

```typescript
export * from './common/helper/http.helper';
```

## dist\index.d.ts

```typescript
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
export * from './common/guard/internal-auth.guard';
export * from './common/guard/secure.guard.service';
export * from './common/guard/secure.guard';
export * from './common/guard/simple.secure.guard';
export * from './common/helper/array.helper';
export * from './common/helper/http.helper';
export * from './common/helper/object.helper';
export * from './common/helper/scalar.helper';
export * from './common/helper/string.helper';
export * from './common/interceptor/add-client-ip.interceptor';
export * from './common/interceptor/remove-private.interceptor';
export * from './common/pipe/safe_id.pipe';
export * from './common/queue/queue.interfaces';
export * from './common/queue/queue-job.entity';
export * from './common/queue/queue-worker.service';
export * from './common/queue/queue.service';
export * from './common/service/bind.service';
export * from './common/service/cookie.service';
export * from './common/service/crypt.service';
export * from './common/service/tree.service';
export * from './common/service/dynamic.save.service';
export * from './common/service/dynamic.service';
export * from './common/service/dynamic.where.service';
export * from './common/service/escape.service';
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
