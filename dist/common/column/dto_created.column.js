"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DtoCreatedColumn = DtoCreatedColumn;
const swagger_1 = require("@nestjs/swagger");
function DtoCreatedColumn() {
    return function (object, propertyName) {
        (0, swagger_1.ApiProperty)({
            description: 'Дата и время создания записи, назначается автоматически',
            required: false,
        })(object, propertyName);
    };
}
//# sourceMappingURL=dto_created.column.js.map