"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextColumn = TextColumn;
const typeorm_1 = require("typeorm");
const indexed_column_1 = require("./indexed.column");
class TextColumnTransformer {
    to(data) {
        return data ? `${data}` : null;
    }
    from(data) {
        return `${data || ''}`;
    }
}
function TextColumn(name, options = undefined) {
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
            transformer: new TextColumnTransformer(),
            type: 'text',
        })(object, propertyName);
    };
}
//# sourceMappingURL=text.column.js.map