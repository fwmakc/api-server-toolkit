"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicService = void 0;
const common_1 = require("@nestjs/common");
const common_service_1 = require("../common.service");
const dynamic_where_service_1 = require("./dynamic.where.service");
const quotes_service_1 = require("./quotes.service");
const dynamic_save_service_1 = require("./dynamic.save.service");
class DynamicService extends common_service_1.CommonService {
    async createEntity(entity) {
        var _a;
        const quotes = (0, quotes_service_1.prepareQuotes)();
        const tableName = this.getTableName();
        const entityData = (0, dynamic_save_service_1.parseDynamicSaveObject)(entity);
        const keys = Object.keys(entityData)
            .map((key) => `${quotes}${key}${quotes}`)
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
            const result = await this.repository.query(query);
            return { id: dbType === 'postgres' ? (_a = result[0]) === null || _a === void 0 ? void 0 : _a.id : result.insertId };
        }
        catch (e) {
            this.error(e);
        }
    }
    async updateEntity(entity) {
        const { id } = entity;
        const quotes = (0, quotes_service_1.prepareQuotes)();
        const tableName = this.getTableName();
        const entityData = (0, dynamic_save_service_1.parseDynamicSaveObject)(entity);
        const set = Object.entries(entityData)
            .map(([key, value]) => `${quotes}${key}${quotes} = ${value}`)
            .join(', ');
        const where = `${quotes}id${quotes} = ${id}`;
        try {
            const query = `
        UPDATE ${tableName}
        SET ${set}
        WHERE ${where};
      `;
            return await this.repository.query(query);
        }
        catch (e) {
            this.error(e);
        }
    }
    async find(find, bind = { allow: true }) {
        const { limit, offset, order, select } = find;
        const { id, name, allow } = bind;
        let where = (0, dynamic_where_service_1.parseDynamicWhereObject)(find.where);
        if (id !== undefined && !allow) {
            const bindWhere = (0, dynamic_where_service_1.parseDynamicWhereObject)({ [name]: id });
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
        }
        catch (e) {
            this.error(e);
        }
    }
    getTableName() {
        const { tableName } = this.repository.metadata;
        const quotes = (0, quotes_service_1.prepareQuotes)();
        return `${quotes}${tableName}${quotes}`;
    }
    fromToString() {
        const tableName = this.getTableName();
        return ` FROM ${tableName}`;
    }
    limitToString(limit) {
        limit = Number(limit);
        return limit ? ` LIMIT ${limit}` : '';
    }
    offsetToString(offset) {
        offset = Number(offset);
        return offset ? ` OFFSET ${offset}` : '';
    }
    orderToString(order) {
        let orderString = '';
        if (order && typeof order === 'object' && !Array.isArray(order)) {
            const quotes = (0, quotes_service_1.prepareQuotes)();
            orderString = Object.entries(order)
                .map(([key, value]) => `${quotes}${key}${quotes} ${`${value || ''}`.toUpperCase()}`)
                .filter(Boolean)
                .join(', ');
        }
        return orderString ? ` ORDER BY ${orderString}` : '';
    }
    selectToString(select) {
        let selectString = '';
        if (select && typeof select === 'object' && !Array.isArray(select)) {
            select = Object.entries(select)
                .map(([key, value]) => (value !== false ? key : false))
                .filter(Boolean);
        }
        if (select && Array.isArray(select)) {
            const quotes = (0, quotes_service_1.prepareQuotes)();
            selectString = select
                .map((value) => `${quotes}${value}${quotes}`)
                .join(', ');
        }
        return `SELECT ${selectString || '*'}`;
    }
    whereToString(where) {
        return Array.isArray(where) && where.length > 0
            ? ` WHERE ${where.map((i) => `(${i})`).join(' AND ')}`
            : '';
    }
    error(e) {
        throw new common_1.BadRequestException(`Incorrect request conditions: ${e.message}`);
    }
}
exports.DynamicService = DynamicService;
//# sourceMappingURL=dynamic.service.js.map