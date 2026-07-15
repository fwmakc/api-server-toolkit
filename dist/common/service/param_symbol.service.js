"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareParams = void 0;
const dotenv = require("dotenv");
dotenv.config();
const prepareParams = (object) => {
    const dbType = process.env.DB_TYPE;
    const result = {};
    Object.keys(object).forEach((key, index) => {
        let symbol = '?';
        if (dbType === 'postgres') {
            symbol = `\$${index + 1}`;
        }
        result[key] = symbol;
    });
    return result;
};
exports.prepareParams = prepareParams;
//# sourceMappingURL=param_symbol.service.js.map