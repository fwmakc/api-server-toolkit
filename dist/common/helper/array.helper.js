"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.arrayUnwrap = exports.arrayWrap = void 0;
const arrayWrap = (value) => {
    return Array.isArray(value) ? value : [value];
};
exports.arrayWrap = arrayWrap;
const arrayUnwrap = (value) => {
    return Array.isArray(value) && value.length ? value[0] : value;
};
exports.arrayUnwrap = arrayUnwrap;
//# sourceMappingURL=array.helper.js.map