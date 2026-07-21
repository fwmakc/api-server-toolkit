"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionRegistry = void 0;
const registry = new Map();
exports.PermissionRegistry = {
    set(entity, config) {
        registry.set(entity, config);
    },
    get(entity) {
        return registry.get(entity);
    },
    getAccountTable(entity) {
        var _a;
        return (_a = registry.get(entity)) === null || _a === void 0 ? void 0 : _a.accountTable;
    },
    getCreate(entity) {
        var _a, _b;
        return (_b = (_a = registry.get(entity)) === null || _a === void 0 ? void 0 : _a.create) !== null && _b !== void 0 ? _b : 'closed';
    },
    getRead(entity) {
        var _a, _b;
        return (_b = (_a = registry.get(entity)) === null || _a === void 0 ? void 0 : _a.read) !== null && _b !== void 0 ? _b : 'closed';
    },
    getUpdate(entity) {
        var _a, _b;
        return (_b = (_a = registry.get(entity)) === null || _a === void 0 ? void 0 : _a.update) !== null && _b !== void 0 ? _b : 'closed';
    },
    getDelete(entity) {
        var _a, _b;
        return (_b = (_a = registry.get(entity)) === null || _a === void 0 ? void 0 : _a.delete) !== null && _b !== void 0 ? _b : 'closed';
    },
    has(entity) {
        return registry.has(entity);
    },
    delete(entity) {
        return registry.delete(entity);
    },
    clear() {
        registry.clear();
    },
};
//# sourceMappingURL=permission.registry.js.map