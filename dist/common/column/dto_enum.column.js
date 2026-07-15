"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DtoEnumColumn = DtoEnumColumn;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
function DtoEnumColumn(description, value, defaultValue = null, options = undefined) {
    const { required = false } = options || {};
    return function (object, propertyName) {
        const properties = {
            description,
            required,
            enum: value,
        };
        const params = {
            nullable: true,
        };
        if (defaultValue !== undefined) {
            properties.default = defaultValue;
            params.defaultValue = defaultValue;
        }
        (0, swagger_1.ApiProperty)(properties)(object, propertyName);
        (0, class_validator_1.IsEnum)(value);
    };
}
//# sourceMappingURL=dto_enum.column.js.map