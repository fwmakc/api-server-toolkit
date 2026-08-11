import { BadRequestException } from '@nestjs/common';
import { BaseEntity, DeepPartial, EntityManager, EntityTarget, FindOptionsOrder, Repository } from 'typeorm';
import { CommonDto } from '../common.dto';
import { FindDto } from '../dto/find.dto';
import { CommonService } from '../common.service';
import { parseDynamicWhereObject } from './dynamic.where.service';
import { prepareQuotes } from './quotes.service';
import { BindDto } from '../dto/bind.dto';
import { parseDynamicSaveObject } from './dynamic.save.service';
import { escapeIdentifier } from './escape.service';
import { throwDbError } from './error.service';

/**
 * DynamicService — raw SQL CRUD for dynamic schemas where entity definitions
 * can't reflect runtime column changes (e.g. legacy tables with ALTER TABLE).
 *
 * All user input is escaped:
 * - String values: escapeQuotes() (single-quote doubling)
 * - Identifiers (column/table names): escapeIdentifier() (double-quote doubling)
 * - Numeric values: parseFloat()
 *
 * Use CommonService for standard CRUD (TypeORM parameterized queries).
 * Use DynamicService only when the schema is unknown at compile time.
 */
export class DynamicService<
  Dto extends CommonDto,
  Entity extends BaseEntity,
> extends CommonService<Dto, Entity> {
  protected readonly repository: Repository<any>;

  async createEntity(entity: DeepPartial<any>, manager?: EntityManager): Promise<any> {
    const quotes = prepareQuotes();
    const tableName = this.getTableName();

    const entityData = parseDynamicSaveObject(entity);
    const keys = Object.keys(entityData)
      .map((key) => `${quotes}${escapeIdentifier(key)}${quotes}`)
      .join(', ');
    const values = Object.values(entityData).join(', ');

    const dbType = process.env.DB_TYPE;
    const returningClause = dbType === 'postgres' ? ' RETURNING id' : '';

    try {
      const query = `
        INSERT INTO ${tableName}
        (${keys})
        VALUES (${values})${returningClause};
      `;
      const result = await (manager || this.repository).query(query);
      return { id: dbType === 'postgres' ? result[0]?.id : result.insertId };
    } catch (e) {
      this.error(e);
    }
  }

  async updateEntity(entity: DeepPartial<any>, manager?: EntityManager): Promise<any> {
    const { id } = entity;

    const quotes = prepareQuotes();
    const tableName = this.getTableName();

    const entityData = parseDynamicSaveObject(entity);
    const set = Object.entries(entityData)
      .map(([key, value]) => `${quotes}${escapeIdentifier(key)}${quotes} = ${value}`)
      .join(', ');

    const where = `${quotes}id${quotes} = ${parseFloat(String(id)) || 0}`;

    try {
      const query = `
        UPDATE ${tableName}
        SET ${set}
        WHERE ${where};
      `;
      return await (manager || this.repository).query(query);
    } catch (e) {
      this.error(e);
    }
  }

  async find(
    find: FindDto,
    bind: BindDto = { allow: true },
  ): Promise<Entity[]> {
    const { limit, offset, order, select } = find;
    const { id, name, allow } = bind;

    let where = parseDynamicWhereObject(find.where);

    if (id !== undefined && !allow) {
      const bindWhere = parseDynamicWhereObject({ [name]: id });
      where = [...where, ...bindWhere];
    }

    try {
      const query = `
        ${this.selectToString(select)}
        ${this.fromToString()}
        ${this.whereToString(where)}
        ${this.orderToString(order)}
        ${this.limitToString(limit)}
        ${this.offsetToString(offset)};
      `;
      return await this.repository.query(query);
    } catch (e) {
      this.error(e);
    }
  }

  protected getTableName() {
    const { tableName } = this.repository.metadata;
    const quotes = prepareQuotes();
    return `${quotes}${tableName}${quotes}`;
  }

  protected fromToString() {
    const tableName = this.getTableName();
    return ` FROM ${tableName}`;
  }

  protected limitToString(limit: number | string | undefined): string {
    limit = Number(limit);
    return limit ? ` LIMIT ${limit}` : '';
  }

  protected offsetToString(offset: number | string | undefined): string {
    offset = Number(offset);
    return offset ? ` OFFSET ${offset}` : '';
  }

  protected orderToString(order: FindOptionsOrder<any> | undefined): string {
    let orderString = '';

    if (order && typeof order === 'object' && !Array.isArray(order)) {
      const quotes = prepareQuotes();
      orderString = Object.entries(order)
        .map(
          ([key, value]) =>
            `${quotes}${escapeIdentifier(key)}${quotes} ${`${value || ''}`.toUpperCase()}`,
        )
        .filter(Boolean)
        .join(', ');
    }

    return orderString ? ` ORDER BY ${orderString}` : '';
  }

  protected selectToString(select) {
    let selectString = '';

    if (select && typeof select === 'object' && !Array.isArray(select)) {
      select = Object.entries(select)
        .map(([key, value]) => (value !== false ? key : false))
        .filter(Boolean);
    }

    if (select && Array.isArray(select)) {
      const quotes = prepareQuotes();
      selectString = select
        .map((value) => `${quotes}${escapeIdentifier(value)}${quotes}`)
        .join(', ');
    }

    return `SELECT ${selectString || '*'}`;
  }

  protected whereToString(where: string[]): string {
    return Array.isArray(where) && where.length > 0
      ? ` WHERE ${where.map((i) => `(${i})`).join(' AND ')}`
      : '';
  }

  error(e) {
    if (e && typeof e === 'object' && 'message' in e && !('code' in e)) {
      throw new BadRequestException(e.message);
    }
    throwDbError(e);
  }
}