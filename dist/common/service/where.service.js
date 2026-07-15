"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseWhereObject = void 0;
const typeorm_1 = require("typeorm");
const like_service_1 = require("./like.service");
const parseWhereObject = (where) => {
    var _a;
    const parsed = {};
    if (!where) {
        return parsed;
    }
    (_a = Object.entries(where)) === null || _a === void 0 ? void 0 : _a.forEach(([key, value]) => {
        var _a;
        const [property, ...modifiers] = key.split('.');
        if (modifiers[0] === 'and' || modifiers[0] === 'or') {
            if (!Array.isArray(value)) {
                return;
            }
            parsed[property] = prepareAndOrValues(value, modifiers);
            return;
        }
        if (value instanceof typeorm_1.FindOperator) {
            parsed[property] = value;
            return;
        }
        if (typeof value === 'object' && !Array.isArray(value)) {
            parsed[property] = (0, exports.parseWhereObject)(value);
            return;
        }
        let tempProperty = value;
        (_a = modifiers === null || modifiers === void 0 ? void 0 : modifiers.reverse()) === null || _a === void 0 ? void 0 : _a.forEach((modifier) => {
            tempProperty = prepareWhereValue(tempProperty, modifier);
        });
        parsed[property] = tempProperty;
    });
    return parsed;
};
exports.parseWhereObject = parseWhereObject;
const prepareAndOrValues = (values, modifiers) => {
    const properties = [];
    values.forEach((value) => {
        var _a;
        let tempProperty = value;
        const [_, ...otherModifiers] = modifiers;
        (_a = otherModifiers === null || otherModifiers === void 0 ? void 0 : otherModifiers.reverse()) === null || _a === void 0 ? void 0 : _a.forEach((modifier) => {
            tempProperty = prepareWhereValue(tempProperty, modifier);
        });
        properties.push(tempProperty);
    });
    if (modifiers[0] === 'and') {
        return (0, typeorm_1.And)(...properties);
    }
    if (modifiers[0] === 'or') {
        return (0, typeorm_1.Or)(...properties);
    }
};
const prepareWhereValue = (value, modifier) => {
    let property;
    switch (modifier) {
        case 'any':
            if (Array.isArray(value) && value.length > 0) {
                property = (0, typeorm_1.Any)(value);
            }
            else {
                throw new Error(`'any' modifier expects an array with more than 1 elements for property '${property}'`);
            }
            break;
        case 'between':
            if (Array.isArray(value) && value.length > 1) {
                property = (0, typeorm_1.Between)(value[0], value[1]);
            }
            else {
                throw new Error(`'between' modifier expects an array with 2 elements for property '${property}'`);
            }
            break;
        case 'boolean':
            const stringValue = `${value}`.trim().toLowerCase();
            if (stringValue === 'true') {
                property = true;
                break;
            }
            if (stringValue === 'false') {
                property = false;
                break;
            }
            property = Boolean(+value);
            break;
        case 'empty':
            property = (0, typeorm_1.Raw)((alias) => `${alias} IS NULL OR ${alias} = ''`);
            break;
        case 'in':
            if (Array.isArray(value) && value.length > 0) {
                property = (0, typeorm_1.In)(value);
            }
            else {
                throw new Error(`'in' modifier expects an array with more than 1 elements for property '${property}'`);
            }
            break;
        case 'less':
            property = (0, typeorm_1.LessThan)(value);
            break;
        case 'lessOrEqual':
            property = (0, typeorm_1.LessThanOrEqual)(value);
            break;
        case 'like':
            property = (0, like_service_1.prepareLikeOrm)(value);
            break;
        case 'more':
            property = (0, typeorm_1.MoreThan)(value);
            break;
        case 'moreOrEqual':
            property = (0, typeorm_1.MoreThanOrEqual)(value);
            break;
        case 'not':
            property = (0, typeorm_1.Not)(value);
            break;
        case 'null':
            property = (0, typeorm_1.IsNull)();
            break;
        case 'number':
            property = parseFloat(value);
            break;
        case 'search':
            const valuesMap = `${value || ''}`
                .toLowerCase()
                .replace(/[^0-9a-zа-я ]/giu, ' ')
                .split(' ')
                .filter(Boolean)
                .map((i) => (0, like_service_1.prepareLikeOrm)(`%${i}%`));
            if (!valuesMap.length) {
                break;
            }
            property = (0, typeorm_1.And)(...valuesMap);
            break;
        case 'string':
            property = `${value}`;
            break;
        default:
            property = value;
    }
    return property;
};
//# sourceMappingURL=where.service.js.map