"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonColumn = JsonColumn;
const typeorm_1 = require("typeorm");
const indexed_column_1 = require("./indexed.column");
function JsonColumn(name, options = undefined) {
    const { comment = undefined, index = undefined } = options || {};
    return function (object, propertyName) {
        if (index) {
            (0, indexed_column_1.IndexedColumn)(index)(object, propertyName);
        }
        (0, typeorm_1.Column)({
            comment,
            default: null,
            name,
            nullable: true,
            type: 'json',
        })(object, propertyName);
    };
}
//# sourceMappingURL=json.column.js.map