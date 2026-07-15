"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatedColumn = CreatedColumn;
const typeorm_1 = require("typeorm");
const indexed_column_1 = require("./indexed.column");
function CreatedColumn(name = 'created_at', options = undefined) {
    const { comment = undefined, index = undefined } = options || {};
    return function (object, propertyName) {
        if (index) {
            (0, indexed_column_1.IndexedColumn)(index)(object, propertyName);
        }
        (0, typeorm_1.CreateDateColumn)({
            comment,
            name,
        })(object, propertyName);
    };
}
//# sourceMappingURL=created.column.js.map