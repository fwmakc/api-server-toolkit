"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bind = bind;
function bind(entrie, { allow, key, name }) {
    const bind = {
        allow,
        id: entrie === null || entrie === void 0 ? void 0 : entrie[key || 'id'],
        key: key || 'id',
        name: name || 'account',
    };
    return bind;
}
//# sourceMappingURL=bind.service.js.map