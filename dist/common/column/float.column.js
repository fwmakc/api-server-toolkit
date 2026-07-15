"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FloatColumn = FloatColumn;
const typeorm_1 = require("typeorm");
const indexed_column_1 = require("./indexed.column");
class FloatColumnTransformer {
    to(data) {
        return data;
    }
    from(data) {
        return parseFloat(data);
    }
}
function FloatColumn(name, value = 0, options = undefined) {
    const { comment = undefined, index = undefined, nullable = undefined, precision = 15, scale = 2, } = options || {};
    return function (object, propertyName) {
        if (index) {
            (0, indexed_column_1.IndexedColumn)(index)(object, propertyName);
        }
        (0, typeorm_1.Column)({
            comment,
            default: +value || 0,
            name,
            nullable: Boolean(nullable),
            precision: +precision || 0,
            scale: +scale || 0,
            transformer: new FloatColumnTransformer(),
            type: 'decimal',
        })(object, propertyName);
    };
}
//# sourceMappingURL=float.column.js.map