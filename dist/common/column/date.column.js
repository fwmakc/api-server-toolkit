"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateColumn = DateColumn;
const typeorm_1 = require("typeorm");
const indexed_column_1 = require("./indexed.column");
function DateColumn(name, options = undefined) {
    const { comment = undefined, index = undefined } = options || {};
    return function (object, propertyName) {
        if (index) {
            (0, indexed_column_1.IndexedColumn)(index)(object, propertyName);
        }
        (0, typeorm_1.CreateDateColumn)({
            comment,
            default: () => 'NULL',
            name,
            nullable: true,
        })(object, propertyName);
    };
}
//# sourceMappingURL=date.column.js.map