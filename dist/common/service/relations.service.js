"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.relationsOrder = void 0;
const isNumber = (value) => {
    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num);
};
const compare = (a, b, desc = false) => {
    if (isNumber(a) && isNumber(b)) {
        a = parseFloat(a);
        b = parseFloat(b);
        return desc ? b - a : a - b;
    }
    return desc
        ? b.toLowerCase().localeCompare(a.toLowerCase())
        : a.toLowerCase().localeCompare(b.toLowerCase());
};
const relationsOrder = (result, relations) => {
    if (!relations || !Array.isArray(relations) || !relations.length) {
        return result;
    }
    result = result === null || result === void 0 ? void 0 : result.map((item) => {
        relations === null || relations === void 0 ? void 0 : relations.forEach(({ name, order, desc = false }) => {
            if (!name || !order) {
                return;
            }
            const keys = name.split('.');
            let currentLevel = item;
            keys.forEach((key, index) => {
                if (!currentLevel[key]) {
                    return;
                }
                if (index === keys.length - 1 && Array.isArray(currentLevel[key])) {
                    currentLevel[key] = currentLevel[key].sort((a, b) => compare(a[order], b[order], desc));
                }
                currentLevel = currentLevel[key];
            });
        });
        return item;
    });
    return result;
};
exports.relationsOrder = relationsOrder;
//# sourceMappingURL=relations.service.js.map