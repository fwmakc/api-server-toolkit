"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VarcharColumn = VarcharColumn;
const typeorm_1 = require("typeorm");
const indexed_column_1 = require("./indexed.column");
class VarcharColumnTransformer {
    constructor(clear) {
        this.clearMatch = new RegExp(`${clear || ''}`, 'giu');
    }
    to(data) {
        data = `${data || ''}`.replace(this.clearMatch, '');
        return data;
    }
    from(data) {
        return `${data || ''}`;
    }
}
const lengths = {
    tiny: 15,
    medium: 1023,
    long: 2047,
};
function VarcharColumn(name, length = 255, options = undefined) {
    const { comment = undefined, index = undefined, clear = undefined, } = options || {};
    if (typeof length === 'string') {
        length = lengths[length] || 255;
    }
    return function (object, propertyName) {
        if (index) {
            (0, indexed_column_1.IndexedColumn)(index)(object, propertyName);
        }
        let transformer;
        if (clear) {
            transformer = new VarcharColumnTransformer(clear);
        }
        (0, typeorm_1.Column)({
            comment,
            default: '',
            name,
            nullable: true,
            length,
            transformer,
            type: 'varchar',
        })(object, propertyName);
    };
}
//# sourceMappingURL=varchar.column.js.map