"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setIfFilled = exports.only = exports.except = void 0;
const scalar_helper_1 = require("./scalar.helper");
const except = (obj, keys) => {
    const toFiltrate = Array.isArray(keys) ? keys : [keys];
    return Object.fromEntries(Object.entries(obj).filter(([key]) => !toFiltrate.includes(key)));
};
exports.except = except;
const only = (obj, keys) => {
    const toFiltrate = Array.isArray(keys) ? keys : [keys];
    return Object.fromEntries(Object.entries(obj).filter(([key]) => toFiltrate.includes(key)));
};
exports.only = only;
const setIfFilled = (target, source, mapping) => {
    if (!mapping) {
        const keysToSet = Object.keys(source);
        keysToSet.forEach((key) => {
            const value = source[key];
            if ((0, scalar_helper_1.isFilled)(value)) {
                const targetKey = key;
                if (targetKey in target) {
                    target[targetKey] = value;
                }
            }
        });
    }
    else if (typeof mapping === 'object' && !Array.isArray(mapping)) {
        Object.entries(mapping).forEach(([targetKey, mappingValue]) => {
            let sourceKey;
            let transform;
            if (typeof mappingValue === 'object' &&
                mappingValue !== null &&
                'sourceKey' in mappingValue) {
                const mappingObj = mappingValue;
                sourceKey = mappingObj.sourceKey;
                transform = mappingObj.transform;
            }
            else {
                sourceKey = mappingValue;
            }
            let value = source[sourceKey];
            if (transform) {
                value = transform(value);
            }
            if ((0, scalar_helper_1.isFilled)(value)) {
                target[targetKey] = value;
            }
        });
    }
    else {
        const keysToSet = Array.isArray(mapping) ? mapping : [mapping];
        keysToSet.forEach((key) => {
            const sourceKey = key;
            const value = source[sourceKey];
            if ((0, scalar_helper_1.isFilled)(value)) {
                target[key] = value;
            }
        });
    }
};
exports.setIfFilled = setIfFilled;
//# sourceMappingURL=object.helper.js.map