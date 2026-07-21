"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const relations_service_1 = require("./service/relations.service");
const where_service_1 = require("./service/where.service");
const private_fields_service_1 = require("./service/private_fields.service");
const sanitize_service_1 = require("./service/sanitize.service");
const nested_filter_service_1 = require("./service/nested_filter.service");
const search_service_1 = require("./service/search.service");
const bind_service_1 = require("./service/bind.service");
const csv_service_1 = require("./service/csv.service");
class CommonService {
    async find(find = {}, bind = { allow: true }) {
        const { relations, limit: take, offset: skip, search, ...otherParams } = find;
        const { id, name, key = 'id', allow } = bind;
        let where = (0, where_service_1.parseWhereObject)(find.where);
        if (id !== undefined && !allow) {
            const bindValue = { [key]: id };
            if (name.includes('.')) {
                const segments = name.split('.');
                let nested = bindValue;
                for (let i = segments.length - 1; i >= 0; i--) {
                    nested = { [segments[i]]: nested };
                }
                where = { ...where, ...nested };
            }
            else {
                where = { ...where, [name]: bindValue };
            }
        }
        const relationNames = (relations === null || relations === void 0 ? void 0 : relations.map((i) => i.name)) || [];
        if (id !== undefined &&
            !name.includes('.') &&
            !relationNames.includes(name)) {
            relationNames.push(name);
        }
        const params = {
            ...otherParams,
            relations: relationNames.length > 0 ? relationNames : undefined,
            where,
            take: take || undefined,
            skip: skip || undefined,
        };
        try {
            let result;
            const isMultiHop = id !== undefined && !allow && name.includes('.');
            const hasPagination = !!(take || skip);
            if (isMultiHop && hasPagination) {
                const idResults = await this.repository.find({
                    ...otherParams,
                    where,
                    select: { id: true },
                });
                const uniqueIds = [];
                const seenIds = new Set();
                for (const r of idResults) {
                    const rid = String(r.id);
                    if (!seenIds.has(rid)) {
                        seenIds.add(rid);
                        uniqueIds.push(r.id);
                    }
                }
                const offsetNum = skip || 0;
                const limitNum = take || uniqueIds.length;
                const paginatedIds = uniqueIds.slice(offsetNum, offsetNum + limitNum);
                if (paginatedIds.length === 0) {
                    result = [];
                }
                else {
                    result = await this.repository.find({
                        ...otherParams,
                        relations: relationNames.length > 0 ? relationNames : undefined,
                        where: { id: (0, typeorm_1.In)(paginatedIds) },
                    });
                }
            }
            else {
                result = await this.repository.find(params);
            }
            result = (0, relations_service_1.relationsOrder)(result, relations);
            if (search) {
                result = result
                    .map((i) => {
                    const contains = (0, search_service_1.searchService)(i, search);
                    return contains ? i : false;
                })
                    .filter(Boolean);
            }
            if (id !== undefined && !allow && name.includes('.')) {
                const seen = new Set();
                result = result.filter((item) => {
                    if (seen.has(item.id))
                        return false;
                    seen.add(item.id);
                    return true;
                });
            }
            (0, nested_filter_service_1.filterNestedRelations)(result, bind);
            result = (0, private_fields_service_1.removePrivateFields)(result, bind);
            return result;
        }
        catch (e) {
            this.error(e);
        }
    }
    async findFirst(find, bind = { allow: true }) {
        const [result] = await this.find({
            ...find,
            limit: 1,
        }, bind);
        return result;
    }
    async findMany(findMany, bind = { allow: true }) {
        const { ids, ...find } = findMany;
        const order = { id: 'ASC' };
        const where = {
            id: (0, typeorm_1.In)(ids === null || ids === void 0 ? void 0 : ids.map((i) => Number(i) || 0)),
        };
        return await this.find({
            ...find,
            order,
            where,
            limit: 0,
            offset: 0,
        }, bind);
    }
    async findOne(findOne, bind = { allow: true }) {
        const { id, ...find } = findOne;
        const where = { ...find.where, id };
        const [result] = await this.find({
            ...find,
            where,
            limit: 1,
            offset: 0,
        }, bind);
        return result;
    }
    async count(find, bind = { allow: true }) {
        find.select = { id: true };
        const result = await this.find(find, bind);
        return result && Array.isArray(result) ? result.length : 0;
    }
    async countDistinct(field, find) {
        const qb = this.repository.createQueryBuilder('t');
        const where = (0, where_service_1.parseWhereObject)(find.where);
        if (where)
            qb.where(where);
        const result = await qb
            .select(`COUNT(DISTINCT t.${field})`, 'count')
            .getRawOne();
        return Number((result === null || result === void 0 ? void 0 : result.count) || 0);
    }
    async csv(find, filename, bind = { allow: true }) {
        const csvService = new csv_service_1.CsvService({
            service: this,
            find,
            bind,
            filename,
        });
        return csvService.execute();
    }
    async create(dto, relations = undefined, bind = { allow: true }) {
        delete dto.id;
        if (bind.id !== undefined) {
            const autoAssign = await this.resolveAutoAssign(bind);
            if (autoAssign) {
                dto[autoAssign.name] = { id: autoAssign.id };
            }
        }
        const entity = { ...dto };
        (0, private_fields_service_1.stripWriteFields)(entity, this.repository.metadata.target, bind);
        (0, sanitize_service_1.sanitizeForSave)(entity, this.repository.metadata, bind);
        try {
            const { id } = await this.createEntity(entity);
            return await this.findOne({
                id,
                relations,
            }, bind);
        }
        catch (e) {
            this.error(e);
        }
    }
    async createEntity(entity) {
        return await this.repository.save(entity);
    }
    getUniqueColumns() {
        const uniques = [];
        this.repository.metadata.indices.forEach((index) => {
            var _a, _b;
            if (index.isUnique) {
                const name = (_b = (_a = index.columns) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.propertyName;
                if (name) {
                    uniques.push(name);
                }
            }
        });
        return uniques;
    }
    async findUniqueEntrie(entity) {
        const uniques = this.getUniqueColumns();
        if (uniques.length === 0) {
            return null;
        }
        const where = uniques
            .filter((field) => entity[field] !== undefined && entity[field] !== null)
            .map((field) => ({ [field]: entity[field] }));
        if (where.length === 0) {
            return null;
        }
        return await this.repository.findOne({
            select: { id: true },
            where: where,
        });
    }
    async upsert(dto, relations = undefined, bind = { allow: true }) {
        delete dto.id;
        const entity = { ...dto };
        if (bind.id !== undefined) {
            const autoAssign = await this.resolveAutoAssign(bind);
            if (autoAssign) {
                entity[autoAssign.name] = { id: autoAssign.id };
            }
        }
        const existsEntrie = await this.findUniqueEntrie(entity);
        if (existsEntrie === null || existsEntrie === void 0 ? void 0 : existsEntrie.id) {
            return await this.update(existsEntrie.id, dto, relations, bind);
        }
        return await this.create(dto, relations, bind);
    }
    async update(id, dto, relations = undefined, bind = { allow: true }) {
        if (id === undefined) {
            return;
        }
        const select = { id: true };
        const find = await this.findOne({ id, select, relations }, bind);
        if (!find) {
            return;
        }
        const entity = { ...dto, id };
        (0, private_fields_service_1.stripWriteFields)(entity, this.repository.metadata.target, bind);
        (0, sanitize_service_1.sanitizeForSave)(entity, this.repository.metadata, bind);
        try {
            await this.updateEntity(entity);
            return await this.findOne({
                id,
                relations,
            }, bind);
        }
        catch (e) {
            this.error(e);
        }
    }
    async updateEntity(entity) {
        const idType = this.getIdType();
        entity.id = idType === 'bigint' ? `${entity.id}` : +entity.id;
        return await this.repository.save(entity);
    }
    getIdType() {
        const column = this.repository.metadata.columns.find((column) => column.propertyName === 'id');
        return (column === null || column === void 0 ? void 0 : column.type) || 'int';
    }
    async resolveBindRelationId(bind) {
        const key = bind.key || 'id';
        if (key === 'id') {
            return bind.id;
        }
        const name = bind.name || 'account';
        const segments = name.split('.');
        let currentMetadata = this.repository.metadata;
        for (const segment of segments) {
            const relation = currentMetadata.relations.find((r) => r.propertyName === segment);
            if (!relation) {
                return null;
            }
            currentMetadata = relation.inverseEntityMetadata;
        }
        const relatedRepo = this.repository.manager.getRepository(currentMetadata.target);
        const related = await relatedRepo.findOne({
            where: { [key]: bind.id },
        });
        return related ? related.id : null;
    }
    async resolveAutoAssign(bind) {
        if (bind.id === undefined)
            return null;
        const name = bind.name || 'account';
        const segments = name.split('.');
        if (segments.length === 1) {
            const resolvedId = await this.resolveBindRelationId(bind);
            return resolvedId !== null
                ? { name: segments[0], id: resolvedId }
                : null;
        }
        const firstSegment = segments[0];
        const relation = this.repository.metadata.relations.find((r) => r.propertyName === firstSegment);
        if (!relation)
            return null;
        if (relation.relationType !== 'many-to-one' &&
            relation.relationType !== 'one-to-one') {
            return null;
        }
        const key = bind.key || 'id';
        let nestedWhere = { [key]: bind.id };
        for (let i = segments.length - 1; i > 0; i--) {
            nestedWhere = { [segments[i]]: nestedWhere };
        }
        const firstRepo = this.repository.manager.getRepository(relation.inverseEntityMetadata.target);
        const result = await firstRepo.findOne({
            where: nestedWhere,
            select: { id: true },
        });
        if (!result) {
            throw new common_1.NotFoundException(`Entity not found for auto-assign path: ${firstSegment}`);
        }
        return { name: firstSegment, id: result.id };
    }
    async remove(id, bind = { allow: true }) {
        if (bind.id !== undefined && !bind.allow) {
            const find = await this.findOne({ id, select: { id: true } }, bind);
            if (!find) {
                return false;
            }
        }
        try {
            const result = await this.repository.delete(id);
            return !!(result === null || result === void 0 ? void 0 : result.affected);
        }
        catch (e) {
            this.error(e);
        }
    }
    async sortPosition(field, find, bind = { allow: true }) {
        var _a;
        this.validatePositionField(field);
        if (!find.order) {
            find.order = { [field]: 'asc', id: 'asc' };
        }
        const entries = await this.find(find, bind);
        if (!entries) {
            return;
        }
        if (typeof ((_a = entries === null || entries === void 0 ? void 0 : entries[0]) === null || _a === void 0 ? void 0 : _a[field]) !== 'number') {
            this.error({ message: 'cannot position by non-numeric field' });
        }
        try {
            await this.repository.manager.transaction(async (transactionalManager) => {
                const entityTarget = this.repository.target;
                if (find.where) {
                    let resetWhere = (0, where_service_1.parseWhereObject)(find.where);
                    if (bind.id !== undefined) {
                        const resolvedId = await this.resolveBindRelationId(bind);
                        resetWhere = {
                            ...resetWhere,
                            [bind.name || 'account']: resolvedId !== null
                                ? { id: resolvedId }
                                : { [bind.key || 'id']: bind.id },
                        };
                    }
                    if (Object.keys(resetWhere).length > 0) {
                        await transactionalManager.update(entityTarget, resetWhere, {
                            [field]: 0,
                        });
                    }
                }
                entries.forEach((entrie, index) => {
                    entrie[field] = index + 1;
                });
                await transactionalManager.save(entityTarget, entries);
            });
            return true;
        }
        catch (e) {
            this.error(e);
        }
    }
    async movePosition(id, field, position, bind = { allow: true }) {
        this.validatePositionField(field);
        if (position === undefined || position === null) {
            return false;
        }
        const entrie = await this.findOne({
            id,
            select: {
                [field]: true,
            },
        }, bind);
        if (!entrie) {
            return false;
        }
        if (typeof entrie[field] !== 'number') {
            this.error({ message: 'cannot position by non-numeric field' });
        }
        const lastEntrie = await this.findFirst({
            select: {
                id: true,
                [field]: true,
            },
            order: {
                [field]: 'DESC',
            },
        }, bind);
        const lastPosition = +(lastEntrie === null || lastEntrie === void 0 ? void 0 : lastEntrie[field]) || 0;
        if (position < 0 || position > lastPosition + 1) {
            if (+id === +(lastEntrie === null || lastEntrie === void 0 ? void 0 : lastEntrie.id)) {
                return false;
            }
            position = lastPosition + 1;
        }
        try {
            const oldPosition = +entrie[field] || 0;
            const newPosition = +position || 0;
            if (oldPosition === newPosition) {
                return false;
            }
            await this.repository.manager.transaction(async (transactionalManager) => {
                const entityTarget = this.repository.target;
                const updateEntries = {
                    [field]: () => oldPosition > newPosition ? `${field} + 1` : `${field} - 1`,
                };
                const whereEntries = {
                    [field]: oldPosition > newPosition
                        ? (0, typeorm_1.And)((0, typeorm_1.MoreThanOrEqual)(newPosition), (0, typeorm_1.LessThan)(oldPosition))
                        : (0, typeorm_1.And)((0, typeorm_1.MoreThan)(oldPosition), (0, typeorm_1.LessThanOrEqual)(newPosition)),
                };
                await transactionalManager.update(entityTarget, whereEntries, updateEntries);
                const updateCurrentEntrie = {
                    [field]: newPosition,
                };
                await transactionalManager.update(entityTarget, id, updateCurrentEntrie);
            });
            return true;
        }
        catch (e) {
            this.error(e);
        }
    }
    bind(entrie, data) {
        return (0, bind_service_1.bind)(entrie, data);
    }
    validatePositionField(field) {
        if (!field || typeof field !== 'string') {
            throw new common_1.BadRequestException('Field name is required');
        }
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field)) {
            throw new common_1.BadRequestException(`Invalid field name: ${field}`);
        }
        const primaryColumns = this.repository.metadata.primaryColumns.map((c) => c.propertyName);
        if (primaryColumns.includes(field)) {
            throw new common_1.BadRequestException(`Cannot sort by primary key: ${field}`);
        }
        const columnNames = this.repository.metadata.columns.map((c) => c.propertyName);
        if (!columnNames.includes(field)) {
            throw new common_1.BadRequestException(`Unknown field: ${field}`);
        }
    }
    error(e) {
        throw new common_1.BadRequestException(`Incorrect request conditions: ${e.message}`);
    }
}
exports.CommonService = CommonService;
//# sourceMappingURL=common.service.js.map