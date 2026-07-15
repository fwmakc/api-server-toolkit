"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BooleanColumn = BooleanColumn;
const typeorm_1 = require("typeorm");
const indexed_column_1 = require("./indexed.column");
class BooleanColumnTransformer {
    to(data) {
        return +data > 0 ? 1 : 0;
    }
    from(data) {
        return Boolean(data);
    }
}
function BooleanColumn(name, value = false, options = undefined) {
    const { comment = undefined, index = undefined } = options || {};
    return function (object, propertyName) {
        if (index) {
            (0, indexed_column_1.IndexedColumn)(index)(object, propertyName);
        }
        const defaultValue = +value || 0;
        (0, typeorm_1.Column)({
            comment,
            default: defaultValue,
            name,
            transformer: new BooleanColumnTransformer(),
            type: 'smallint',
            width: 1,
        })(object, propertyName);
    };
}
//# sourceMappingURL=boolean.column.js.map