import { BaseEntity, DeepPartial, Repository } from 'typeorm';
import { CommonDto } from '../common.dto';
import { FindDto } from '../dto/find.dto';
import { CommonService } from '../common.service';
import { BindDto } from '../dto/bind.dto';
export declare class DynamicService<Dto extends CommonDto, Entity extends BaseEntity> extends CommonService<Dto, Entity> {
    protected readonly repository: Repository<any>;
    createEntity(entity: DeepPartial<any>): Promise<any>;
    updateEntity(entity: DeepPartial<any>): Promise<any>;
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
