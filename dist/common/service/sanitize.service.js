"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeForSave = sanitizeForSave;
const permission_registry_1 = require("../permission.registry");
const access_type_1 = require("../access.type");
function canCreate(level, bind) {
    if (!bind)
        return level === 'public';
    switch (level) {
        case 'public':
            return true;
        case 'account':
            return (bind === null || bind === void 0 ? void 0 : bind.id) !== undefined || (bind === null || bind === void 0 ? void 0 : bind.allow) === true;
        case 'owner':
            return true;
        case 'admin':
            return !!(bind === null || bind === void 0 ? void 0 : bind.allow);
        case 'closed':
            return false;
        default:
            return true;
    }
}
function sanitizeForSave(entity, metadata, bind) {
    const seen = new WeakSet();
    sanitizeEntity(entity, metadata, bind, seen);
}
function sanitizeEntity(entity, metadata, bind, seen) {
    if (!entity || typeof entity !== 'object' || seen.has(entity))
        return;
    seen.add(entity);
    for (const relation of metadata.relations) {
        const key = relation.propertyName;
        const value = entity[key];
        if (value === undefined || value === null)
            continue;
        const relatedMeta = relation.inverseEntityMetadata;
        const relatedTarget = relatedMeta.target;
        const config = permission_registry_1.PermissionRegistry.get(relatedTarget);
        if (Array.isArray(value)) {
            const sanitized = [];
            for (const item of value) {
                const result = sanitizeRelationItem(item, relatedMeta, config, bind, seen);
                if (result !== null)
                    sanitized.push(result);
            }
            entity[key] = sanitized;
        }
        else if (typeof value === 'object' && value.constructor !== Date) {
            const result = sanitizeRelationItem(value, relatedMeta, config, bind, seen);
            if (result === null) {
                delete entity[key];
            }
            else {
                entity[key] = result;
            }
        }
    }
}
function sanitizeRelationItem(item, metadata, config, bind, seen) {
    if (!item || typeof item !== 'object')
        return item;
    const hasId = item.id !== undefined && item.id !== null;
    if (hasId) {
        return { id: item.id };
    }
    if (config) {
        const createLevel = (0, access_type_1.normalizeAccess)(config.create, 'public');
        if (canCreate(createLevel, bind)) {
            sanitizeEntity(item, metadata, bind, seen);
            return item;
        }
    }
    return null;
}
//# sourceMappingURL=sanitize.service.js.map