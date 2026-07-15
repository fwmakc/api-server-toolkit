"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareQuotes = void 0;
const prepareQuotes = () => {
    const dbQuotes = process.env.DB_QUOTES;
    if (dbQuotes) {
        return dbQuotes;
    }
    const dbType = process.env.DB_TYPE;
    if (dbType === 'mysql') {
        return '`';
    }
    if (dbType === 'postgres') {
        return '"';
    }
};
exports.prepareQuotes = prepareQuotes;
//# sourceMappingURL=quotes.service.js.map