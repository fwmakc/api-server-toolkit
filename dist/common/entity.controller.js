"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityController = void 0;
const common_1 = require("@nestjs/common");
const common_decorator_1 = require("./common.decorator");
const swagger_1 = require("@nestjs/swagger");
const auth_decorator_1 = require("./auth.decorator");
const bind_service_1 = require("./service/bind.service");
const permission_registry_1 = require("./permission.registry");
const access_type_1 = require("./access.type");
const safe_id_pipe_1 = require("./pipe/safe_id.pipe");
function resolveBind(access, account, accountTable, accountField) {
    const level = (0, access_type_1.normalizeAccess)(access);
    if (level === 'owner') {
        const bindPath = (0, access_type_1.getBindPath)(access, accountTable || 'account');
        return (0, bind_service_1.bind)(account, {
            name: bindPath,
            key: accountField,
            allow: account === null || account === void 0 ? void 0 : account.isSuperuser,
        });
    }
    if (level === 'admin') {
        if (!(account === null || account === void 0 ? void 0 : account.isSuperuser)) {
            throw new common_1.ForbiddenException('You have no rights!');
        }
        return { allow: true };
    }
    return undefined;
}
function guard(access) {
    return (0, access_type_1.normalizeAccess)(access) === 'public' ? (0, auth_decorator_1.Account)('noBlock') : (0, auth_decorator_1.Account)();
}
function route(access, method, docName, dto) {
    const level = (0, access_type_1.normalizeAccess)(access);
    if (level === 'closed')
        return (0, common_1.applyDecorators)();
    const decs = [guard(access), method];
    if (docName)
        decs.push((0, common_decorator_1.Doc)(docName, dto));
    return (0, common_1.applyDecorators)(...decs);
}
function filterRelations(relations, whitelist) {
    if (!relations || !Array.isArray(relations))
        return relations;
    if (!whitelist || whitelist.length === 0)
        return undefined;
    return relations.filter((r) => r.name && whitelist.includes(r.name));
}
const EntityController = (options) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const { name, dto, entity } = options;
    const accountTable = (_a = options.accountTable) !== null && _a !== void 0 ? _a : '';
    const accountField = (_b = options.accountField) !== null && _b !== void 0 ? _b : 'id';
    const readAccess = (_d = (_c = options.operations) === null || _c === void 0 ? void 0 : _c.read) !== null && _d !== void 0 ? _d : 'closed';
    const createAccess = (_f = (_e = options.operations) === null || _e === void 0 ? void 0 : _e.create) !== null && _f !== void 0 ? _f : 'closed';
    const updateAccess = (_h = (_g = options.operations) === null || _g === void 0 ? void 0 : _g.update) !== null && _h !== void 0 ? _h : 'closed';
    const deleteAccess = (_k = (_j = options.operations) === null || _j === void 0 ? void 0 : _j.delete) !== null && _k !== void 0 ? _k : 'closed';
    const allowedRelations = options.relations;
    permission_registry_1.PermissionRegistry.set(entity, {
        create: createAccess,
        read: readAccess,
        update: updateAccess,
        delete: deleteAccess,
        accountTable: accountTable || undefined,
    });
    const readRoute = route(readAccess, (0, common_1.Get)('find'), 'find', dto);
    const readFirstRoute = route(readAccess, (0, common_1.Get)('find/first'), 'findFirst', dto);
    const readManyRoute = route(readAccess, (0, common_1.Get)('find/many/:ids'), 'findMany', dto);
    const readOneRoute = route(readAccess, (0, common_1.Get)('find/:id'), 'findOne', dto);
    const countRoute = route(readAccess, (0, common_1.Get)('count'), 'count', dto);
    const selfRoute = route(readAccess, (0, common_1.Get)('self'), 'self', dto);
    const createRoute = route(createAccess, (0, common_1.Post)('create'), 'create', dto);
    const updateRoute = route(updateAccess, (0, common_1.Patch)('update/:id'), 'update', dto);
    const removeRoute = route(deleteAccess, (0, common_1.Delete)('remove/:id'), 'remove');
    const sortRoute = route(updateAccess, (0, common_1.Post)('position/sort'), 'sortPosition', dto);
    const moveRoute = route(updateAccess, (0, common_1.Post)('position/move/:id'), 'movePosition', dto);
    const hasSelf = (0, access_type_1.normalizeAccess)(readAccess) === 'owner';
    const selfDecorator = hasSelf ? selfRoute : (0, common_1.applyDecorators)();
    let BaseEntityController = class BaseEntityController {
        async self(select, where, order, relations, account) {
            const b = (0, bind_service_1.bind)(account, {
                name: accountTable || 'account',
                key: accountField,
                allow: false,
            });
            return await this.service.find({ where, select, order, relations: filterRelations(relations, allowedRelations) }, b);
        }
        async find(search, select, where, order, limit = undefined, offset = undefined, relations, account) {
            const b = resolveBind(readAccess, account, accountTable, accountField);
            return await this.service.find({ search, select, where, order, limit, offset, relations: filterRelations(relations, allowedRelations) }, b);
        }
        async findFirst(search, select, where, order, relations, account) {
            const b = resolveBind(readAccess, account, accountTable, accountField);
            return await this.service.findFirst({ search, select, where, order, relations: filterRelations(relations, allowedRelations) }, b);
        }
        async findMany(ids, select, relations, account) {
            const b = resolveBind(readAccess, account, accountTable, accountField);
            const result = await this.service.findMany({ ids, select, relations: filterRelations(relations, allowedRelations) }, b);
            if (!result) {
                throw new common_1.NotFoundException('Entrie not found');
            }
            return result;
        }
        async findOne(id, select, relations, account) {
            const b = resolveBind(readAccess, account, accountTable, accountField);
            const result = await this.service.findOne({ id, select, relations: filterRelations(relations, allowedRelations) }, b);
            if (!result) {
                throw new common_1.NotFoundException('Entrie not found');
            }
            return result;
        }
        async count(where, limit = undefined, offset = undefined, relations, account) {
            const b = resolveBind(readAccess, account, accountTable, accountField);
            return await this.service.count({ where, limit, offset, relations: filterRelations(relations, allowedRelations) }, b);
        }
        async create(dto, relations, account) {
            const b = resolveBind(createAccess, account, accountTable, accountField);
            return await this.service.create(dto, filterRelations(relations, allowedRelations), b);
        }
        async update(id, dto, relations, account) {
            const b = resolveBind(updateAccess, account, accountTable, accountField);
            const result = await this.service.update(id, dto, filterRelations(relations, allowedRelations), b);
            if (!result) {
                throw new common_1.NotFoundException('Entrie not found');
            }
            return result;
        }
        async remove(id, account) {
            const b = resolveBind(deleteAccess, account, accountTable, accountField);
            return await this.service.remove(id, b);
        }
        async sortPosition(field, select, where, order, limit = undefined, offset = undefined, relations, account) {
            const b = resolveBind(updateAccess, account, accountTable, accountField);
            const result = await this.service.sortPosition(field, { select, where, order, limit, offset, relations: filterRelations(relations, allowedRelations) }, b);
            if (!result) {
                throw new common_1.NotFoundException('Entries not found');
            }
            return result;
        }
        async movePosition(id, field, position = undefined, account) {
            const b = resolveBind(updateAccess, account, accountTable, accountField);
            const result = await this.service.movePosition(id, field, position, b);
            if (!result) {
                throw new common_1.NotFoundException('Entrie position has not been moved');
            }
            return result;
        }
    };
    __decorate([
        selfDecorator,
        __param(0, (0, common_decorator_1.Data)('select')),
        __param(1, (0, common_decorator_1.Data)('where')),
        __param(2, (0, common_decorator_1.Data)('order')),
        __param(3, (0, common_decorator_1.Data)('relations')),
        __param(4, (0, auth_decorator_1.Self)('noBlock')),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object, Object, Array, Object]),
        __metadata("design:returntype", Promise)
    ], BaseEntityController.prototype, "self", null);
    __decorate([
        readRoute,
        __param(0, (0, common_decorator_1.Data)('search')),
        __param(1, (0, common_decorator_1.Data)('select')),
        __param(2, (0, common_decorator_1.Data)('where')),
        __param(3, (0, common_decorator_1.Data)('order')),
        __param(4, (0, common_decorator_1.Data)('limit')),
        __param(5, (0, common_decorator_1.Data)('offset')),
        __param(6, (0, common_decorator_1.Data)('relations')),
        __param(7, (0, auth_decorator_1.Self)('noBlock')),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object, Object, Object, Number, Number, Array, Object]),
        __metadata("design:returntype", Promise)
    ], BaseEntityController.prototype, "find", null);
    __decorate([
        readFirstRoute,
        __param(0, (0, common_decorator_1.Data)('search')),
        __param(1, (0, common_decorator_1.Data)('select')),
        __param(2, (0, common_decorator_1.Data)('where')),
        __param(3, (0, common_decorator_1.Data)('order')),
        __param(4, (0, common_decorator_1.Data)('relations')),
        __param(5, (0, auth_decorator_1.Self)('noBlock')),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object, Object, Object, Array, Object]),
        __metadata("design:returntype", Promise)
    ], BaseEntityController.prototype, "findFirst", null);
    __decorate([
        readManyRoute,
        __param(0, (0, common_1.Param)('ids', new common_1.ParseArrayPipe({ items: Number, separator: ',' }))),
        __param(1, (0, common_decorator_1.Data)('select')),
        __param(2, (0, common_decorator_1.Data)('relations')),
        __param(3, (0, auth_decorator_1.Self)('noBlock')),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Array, Object, Array, Object]),
        __metadata("design:returntype", Promise)
    ], BaseEntityController.prototype, "findMany", null);
    __decorate([
        readOneRoute,
        __param(0, (0, common_1.Param)('id', safe_id_pipe_1.SafeIdPipe)),
        __param(1, (0, common_decorator_1.Data)('select')),
        __param(2, (0, common_decorator_1.Data)('relations')),
        __param(3, (0, auth_decorator_1.Self)('noBlock')),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String, Object, Array, Object]),
        __metadata("design:returntype", Promise)
    ], BaseEntityController.prototype, "findOne", null);
    __decorate([
        countRoute,
        __param(0, (0, common_decorator_1.Data)('where')),
        __param(1, (0, common_decorator_1.Data)('limit')),
        __param(2, (0, common_decorator_1.Data)('offset')),
        __param(3, (0, common_decorator_1.Data)('relations')),
        __param(4, (0, auth_decorator_1.Self)('noBlock')),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Number, Number, Array, Object]),
        __metadata("design:returntype", Promise)
    ], BaseEntityController.prototype, "count", null);
    __decorate([
        createRoute,
        __param(0, (0, common_1.Body)('create')),
        __param(1, (0, common_1.Body)('relations')),
        __param(2, (0, auth_decorator_1.Self)('noBlock')),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Array, Object]),
        __metadata("design:returntype", Promise)
    ], BaseEntityController.prototype, "create", null);
    __decorate([
        updateRoute,
        __param(0, (0, common_1.Param)('id', safe_id_pipe_1.SafeIdPipe)),
        __param(1, (0, common_1.Body)('update')),
        __param(2, (0, common_1.Body)('relations')),
        __param(3, (0, auth_decorator_1.Self)('noBlock')),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String, Object, Array, Object]),
        __metadata("design:returntype", Promise)
    ], BaseEntityController.prototype, "update", null);
    __decorate([
        removeRoute,
        __param(0, (0, common_1.Param)('id', safe_id_pipe_1.SafeIdPipe)),
        __param(1, (0, auth_decorator_1.Self)('noBlock')),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String, Object]),
        __metadata("design:returntype", Promise)
    ], BaseEntityController.prototype, "remove", null);
    __decorate([
        sortRoute,
        __param(0, (0, common_decorator_1.Data)('field')),
        __param(1, (0, common_decorator_1.Data)('select')),
        __param(2, (0, common_decorator_1.Data)('where')),
        __param(3, (0, common_decorator_1.Data)('order')),
        __param(4, (0, common_decorator_1.Data)('limit')),
        __param(5, (0, common_decorator_1.Data)('offset')),
        __param(6, (0, common_decorator_1.Data)('relations')),
        __param(7, (0, auth_decorator_1.Self)('noBlock')),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String, Object, Object, Object, Number, Number, Array, Object]),
        __metadata("design:returntype", Promise)
    ], BaseEntityController.prototype, "sortPosition", null);
    __decorate([
        moveRoute,
        __param(0, (0, common_1.Param)('id', safe_id_pipe_1.SafeIdPipe)),
        __param(1, (0, common_decorator_1.Data)('field')),
        __param(2, (0, common_decorator_1.Data)('position')),
        __param(3, (0, auth_decorator_1.Self)('noBlock')),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String, String, Number, Object]),
        __metadata("design:returntype", Promise)
    ], BaseEntityController.prototype, "movePosition", null);
    BaseEntityController = __decorate([
        (0, swagger_1.ApiTags)(name)
    ], BaseEntityController);
    return BaseEntityController;
};
exports.EntityController = EntityController;
//# sourceMappingURL=entity.controller.js.map