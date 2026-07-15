"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnumColumn = EnumColumn;
const typeorm_1 = require("typeorm");
const indexed_column_1 = require("./indexed.column");
function EnumColumn(name, value, defaultValue = null, options = undefined) {
    const { comment = undefined, index = undefined } = options || {};
    return function (object, propertyName) {
        if (index) {
            (0, indexed_column_1.IndexedColumn)(index)(object, propertyName);
        }
        (0, typeorm_1.Column)({
            comment,
            default: defaultValue,
            enum: value,
            name,
            nullable: true,
            type: 'enum',
        })(object, propertyName);
    };
}
//# sourceMappingURL=enum.column.js.map