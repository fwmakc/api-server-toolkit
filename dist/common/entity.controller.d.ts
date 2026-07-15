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
        findMany(ids: Array<number>, select: object, relations: Array<RelationsDto>, account: AccountLike): Promise<Entity[]>;
        findOne(id: number, select: object, relations: Array<RelationsDto>, account: AccountLike): Promise<Entity>;
        count(where: object, limit: number, offset: number, relations: Array<RelationsDto>, account: AccountLike): Promise<number>;
        create(dto: Dto, relations: Array<RelationsDto>, account: AccountLike): Promise<Entity>;
        update(id: number, dto: Dto, relations: Array<RelationsDto>, account: AccountLike): Promise<Entity>;
        remove(id: number, account: AccountLike): Promise<boolean>;
        sortPosition(field: string, select: object, where: object, order: object, limit: number, offset: number, relations: Array<RelationsDto>, account: AccountLike): Promise<boolean>;
        movePosition(id: number, field: string, position: number, account: AccountLike): Promise<boolean>;
    };
};
