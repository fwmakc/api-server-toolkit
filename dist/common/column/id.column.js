"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdColumn = IdColumn;
const typeorm_1 = require("typeorm");
function IdColumn(type = 'bigint', comment = undefined) {
    return function (object, propertyName) {
        (0, typeorm_1.PrimaryGeneratedColumn)({
            comment,
            name: 'id',
            type,
            unsigned: true,
        })(object, propertyName);
    };
}
//# sourceMappingURL=id.column.js.map