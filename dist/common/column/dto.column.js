"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DtoColumn = DtoColumn;
const swagger_1 = require("@nestjs/swagger");
function DtoColumn(description = '', options = undefined) {
    const { required = false, defaultValue = undefined } = options || {};
    return function (object, propertyName) {
        const properties = {
            description,
            required,
        };
        const params = {
            nullable: true,
        };
        if (defaultValue !== undefined) {
            properties.default = defaultValue;
            params.defaultValue = defaultValue;
        }
        (0, swagger_1.ApiProperty)(properties)(object, propertyName);
    };
}
//# sourceMappingURL=dto.column.js.map