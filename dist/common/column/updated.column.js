"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatedColumn = UpdatedColumn;
const typeorm_1 = require("typeorm");
const indexed_column_1 = require("./indexed.column");
function UpdatedColumn(name = 'updated_at', options = undefined) {
    const { comment = undefined, index = undefined } = options || {};
    return function (object, propertyName) {
        if (index) {
            (0, indexed_column_1.IndexedColumn)(index)(object, propertyName);
        }
        (0, typeorm_1.UpdateDateColumn)({
            comment,
            name,
        })(object, propertyName);
    };
}
//# sourceMappingURL=updated.column.js.map