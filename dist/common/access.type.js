"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeAccess = normalizeAccess;
exports.getBindPath = getBindPath;
function normalizeAccess(access, fallback = 'closed') {
    if (access === undefined)
        return fallback;
    if (typeof access === 'string')
        return access;
    return access.level;
}
function getBindPath(access, fallback) {
    if (access && typeof access === 'object' && access.bindPath) {
        return access.bindPath;
    }
    if (access === 'owner' ||
        (typeof access === 'object' && (access === null || access === void 0 ? void 0 : access.level) === 'owner')) {
        return fallback;
    }
    return undefined;
}
//# sourceMappingURL=access.type.js.map