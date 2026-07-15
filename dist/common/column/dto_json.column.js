"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DtoJsonColumn = DtoJsonColumn;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
function DtoJsonColumn(description, options = undefined) {
    const { required = false } = options || {};
    return function (object, propertyName) {
        const properties = {
            description,
            required,
        };
        const params = {
            nullable: true,
        };
        (0, swagger_1.ApiProperty)(properties)(object, propertyName);
        (0, class_validator_1.IsJSON)();
        (0, class_validator_1.IsOptional)();
    };
}
//# sourceMappingURL=dto_json.column.js.map