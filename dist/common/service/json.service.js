"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareJsonOrm = void 0;
const typeorm_1 = require("typeorm");
const prepareJsonOrm = (value) => {
    if (typeof value !== 'object') {
        return;
    }
    if (process.env.DB_TYPE === 'postgres') {
        return (0, typeorm_1.JsonContains)(value);
    }
    return (0, typeorm_1.Raw)((alias) => `JSON_CONTAINS(${alias}, '${JSON.stringify(value)}')`);
};
exports.prepareJsonOrm = prepareJsonOrm;
//# sourceMappingURL=json.service.js.map