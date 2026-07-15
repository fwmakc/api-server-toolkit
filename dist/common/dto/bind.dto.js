"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BindDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class BindDto {
}
exports.BindDto = BindDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'ID связанной записи',
    }),
    __metadata("design:type", Object)
], BindDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'название связанной таблицы',
    }),
    __metadata("design:type", String)
], BindDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'ключ поля ID связанной таблицы',
    }),
    __metadata("design:type", String)
], BindDto.prototype, "key", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'поле управляет отображением защищенных полей: true - разрешить все, false - разрешает отображение защищенных полей только для указанного ID связанной записи',
    }),
    __metadata("design:type", Boolean)
], BindDto.prototype, "allow", void 0);
//# sourceMappingURL=bind.dto.js.map