"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DtoUpdatedColumn = DtoUpdatedColumn;
const swagger_1 = require("@nestjs/swagger");
function DtoUpdatedColumn() {
    return function (object, propertyName) {
        (0, swagger_1.ApiProperty)({
            description: 'Дата и время последнего обновления записи, назначается автоматически',
            required: false,
        })(object, propertyName);
    };
}
//# sourceMappingURL=dto_updated.column.js.map