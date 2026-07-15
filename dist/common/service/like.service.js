"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareLikeOrm = exports.prepareLike = void 0;
const typeorm_1 = require("typeorm");
const prepareLike = () => {
    if (process.env.DB_TYPE === 'postgres') {
        return 'ILIKE';
    }
    return 'LIKE';
};
exports.prepareLike = prepareLike;
const prepareLikeOrm = (value) => {
    if (process.env.DB_TYPE === 'postgres') {
        return (0, typeorm_1.ILike)(value);
    }
    return (0, typeorm_1.Like)(value);
};
exports.prepareLikeOrm = prepareLikeOrm;
//# sourceMappingURL=like.service.js.map