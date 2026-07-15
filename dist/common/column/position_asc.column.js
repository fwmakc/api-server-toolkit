"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionAscColumn = PositionAscColumn;
const typeorm_1 = require("typeorm");
const indexed_column_1 = require("./indexed.column");
function PositionAscColumn(name = 'position', options = undefined) {
    const { comment = undefined, index = undefined } = options || {};
    return function (object, propertyName) {
        if (index) {
            (0, indexed_column_1.IndexedColumn)(index)(object, propertyName);
        }
        (0, typeorm_1.Column)({
            comment,
            default: 2147483647,
            name,
            nullable: true,
            type: 'int',
            unsigned: true,
        })(object, propertyName);
    };
}
//# sourceMappingURL=position_asc.column.js.map