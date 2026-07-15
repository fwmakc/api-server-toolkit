"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripWriteFields = exports.removePrivateFields = void 0;
const field_access_decorator_1 = require("../decorator/field_access.decorator");
function canRead(level, bind, dto) {
    if (!bind)
        return level === 'public';
    switch (level) {
        case 'public':
            return true;
        case 'account':
            return bind.id !== undefined || bind.allow === true;
        case 'owner':
            if (bind.allow)
                return true;
            if (bind.id === undefined)
                return false;
            {
                const { id, key = 'id', name = 'account' } = bind;
                let ownerEntity;
                if (name.includes('.')) {
                    ownerEntity = name
                        .split('.')
                        .reduce((acc, segment) => acc === null || acc === void 0 ? void 0 : acc[segment], dto);
                    if (!ownerEntity)
                        return true;
                }
                else {
                    ownerEntity = dto === null || dto === void 0 ? void 0 : dto[name];
                }
                const ownerId = ownerEntity === null || ownerEntity === void 0 ? void 0 : ownerEntity[key];
                const ownerIdFallback = dto === null || dto === void 0 ? void 0 : dto[name + 'Id'];
                return (String(ownerId) === String(id) ||
                    String(ownerIdFallback) === String(id));
            }
        case 'admin':
            return !!bind.allow;
        case 'closed':
            return false;
        default:
            return true;
    }
}
function canWrite(level, bind) {
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
const removePrivateFields = (result, bind) => {
    const seen = new WeakSet();
    if (Array.isArray(result)) {
        result.forEach((entry) => entry && processDto(entry, bind, seen));
    }
    else if (result && typeof result === 'object') {
        processDto(result, bind, seen);
    }
    return result;
};
exports.removePrivateFields = removePrivateFields;
const processDto = (dto, bind, seen) => {
    var _a;
    if (!dto || typeof dto !== 'object' || seen.has(dto))
        return;
    seen.add(dto);
    const proto = (_a = dto.constructor) === null || _a === void 0 ? void 0 : _a.prototype;
    for (const key of Object.keys(dto)) {
        const fieldAccess = proto
            ? Reflect.getMetadata(field_access_decorator_1.FIELD_ACCESS_METADATA, proto, key)
            : undefined;
        if ((fieldAccess === null || fieldAccess === void 0 ? void 0 : fieldAccess.read) && fieldAccess.read !== 'public') {
            if (!canRead(fieldAccess.read, bind, dto)) {
                delete dto[key];
                continue;
            }
        }
        const value = dto[key];
        if (value && typeof value === 'object') {
            if (Array.isArray(value)) {
                value.forEach((item) => item && processDto(item, bind, seen));
            }
            else if (value.constructor &&
                value.constructor !== Object &&
                value.constructor !== Date) {
                processDto(value, bind, seen);
            }
        }
    }
};
const stripWriteFields = (dto, entityTarget, bind) => {
    const proto = entityTarget === null || entityTarget === void 0 ? void 0 : entityTarget.prototype;
    if (!proto)
        return;
    for (const key of Object.keys(dto)) {
        const fieldAccess = Reflect.getMetadata(field_access_decorator_1.FIELD_ACCESS_METADATA, proto, key);
        if (!(fieldAccess === null || fieldAccess === void 0 ? void 0 : fieldAccess.write) || fieldAccess.write === 'public')
            continue;
        if (!canWrite(fieldAccess.write, bind)) {
            delete dto[key];
        }
    }
};
exports.stripWriteFields = stripWriteFields;
//# sourceMappingURL=private_fields.service.js.map