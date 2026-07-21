"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterNestedRelations = filterNestedRelations;
const permission_registry_1 = require("../permission.registry");
function isOwnedBy(entity, accountTable, callerId, accountField) {
    const segments = accountTable.split('.');
    let current = entity;
    for (const segment of segments) {
        current = current === null || current === void 0 ? void 0 : current[segment];
        if (!current)
            return false;
    }
    return String(current === null || current === void 0 ? void 0 : current[accountField]) === String(callerId);
}
function filterNestedRelations(result, bind) {
    if (!result || !Array.isArray(result))
        return;
    if (!bind || bind.id === undefined || bind.allow)
        return;
    const seen = new WeakSet();
    const callerId = bind.id;
    const accountField = bind.key || 'id';
    const walkObject = (obj) => {
        if (!obj || typeof obj !== 'object' || seen.has(obj))
            return;
        seen.add(obj);
        for (const key of Object.keys(obj)) {
            const value = obj[key];
            if (Array.isArray(value)) {
                let filtered = value;
                const firstEntity = value.find((v) => v && typeof v === 'object' && v.constructor);
                if (firstEntity === null || firstEntity === void 0 ? void 0 : firstEntity.constructor) {
                    const config = permission_registry_1.PermissionRegistry.get(firstEntity.constructor);
                    if (config === null || config === void 0 ? void 0 : config.accountTable) {
                        filtered = value.filter((nested) => isOwnedBy(nested, config.accountTable, callerId, accountField));
                        obj[key] = filtered;
                    }
                }
                filtered.forEach((item) => walkObject(item));
            }
            else if (value &&
                typeof value === 'object' &&
                value.constructor &&
                value.constructor !== Object &&
                value.constructor !== Date) {
                const config = permission_registry_1.PermissionRegistry.get(value.constructor);
                if (config === null || config === void 0 ? void 0 : config.accountTable) {
                    if (!isOwnedBy(value, config.accountTable, callerId, accountField)) {
                        delete obj[key];
                        continue;
                    }
                }
                walkObject(value);
            }
        }
    };
    result.forEach((item) => walkObject(item));
}
//# sourceMappingURL=nested_filter.service.js.map