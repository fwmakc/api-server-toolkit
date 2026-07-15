"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchService = void 0;
const searchService = (result, search) => {
    var _a;
    const { fields, terms, method } = search;
    const and = `${method || ''}` !== 'or';
    const text = (_a = extractValues(result, fields)) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    if (and) {
        return terms.every((term) => textIncludes(text, term));
    }
    return terms.some((term) => textIncludes(text, term));
};
exports.searchService = searchService;
const extractValues = (obj, keys) => {
    return keys
        .map((key) => {
        const path = key.split('.');
        return path.reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : null), obj);
    })
        .filter((value) => value !== null)
        .join(' ');
};
const textIncludes = (text, term) => {
    return text.includes(term.toLowerCase());
};
//# sourceMappingURL=search.service.js.map