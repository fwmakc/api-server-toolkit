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
    getCreate(entity) {
        var _a, _b;
        return (_b = (_a = registry.get(entity)) === null || _a === void 0 ? void 0 : _a.create) !== null && _b !== void 0 ? _b : 'public';
    },
    getRead(entity) {
        var _a, _b;
        return (_b = (_a = registry.get(entity)) === null || _a === void 0 ? void 0 : _a.read) !== null && _b !== void 0 ? _b : 'public';
    },
    getUpdate(entity) {
        var _a, _b;
        return (_b = (_a = registry.get(entity)) === null || _a === void 0 ? void 0 : _a.update) !== null && _b !== void 0 ? _b : 'public';
    },
    getDelete(entity) {
        var _a, _b;
        return (_b = (_a = registry.get(entity)) === null || _a === void 0 ? void 0 : _a.delete) !== null && _b !== void 0 ? _b : 'public';
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