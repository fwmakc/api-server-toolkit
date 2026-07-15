"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BigIntColumn = BigIntColumn;
const typeorm_1 = require("typeorm");
const indexed_column_1 = require("./indexed.column");
class BigIntColumnTransformer {
    to(data) {
        return data;
    }
    from(data) {
        return parseInt(data);
    }
}
function BigIntColumn(name, value = 0, options = undefined) {
    const { comment = undefined, index = undefined, nullable = undefined, unsigned = undefined, width = undefined, } = options || {};
    return function (object, propertyName) {
        if (index) {
            (0, indexed_column_1.IndexedColumn)(index)(object, propertyName);
        }
        const props = {
            comment,
            default: +value || 0,
            name,
            transformer: new BigIntColumnTransformer(),
            type: 'bigint',
        };
        if (nullable) {
            props.nullable = true;
        }
        if (width) {
            props.width = width;
        }
        if (unsigned) {
            props.unsigned = true;
        }
        (0, typeorm_1.Column)(props)(object, propertyName);
    };
}
//# sourceMappingURL=bigint.column.js.map