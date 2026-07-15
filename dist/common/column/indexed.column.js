"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexedColumn = IndexedColumn;
const typeorm_1 = require("typeorm");
function IndexedColumn(index = undefined) {
    if (index === 'unique') {
        return (0, typeorm_1.Index)({
            unique: true,
        });
    }
    return (0, typeorm_1.Index)();
}
//# sourceMappingURL=indexed.column.js.map