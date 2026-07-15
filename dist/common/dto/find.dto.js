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
exports.FindDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class FindDto {
    constructor() {
        this.select = undefined;
        this.where = undefined;
        this.search = undefined;
        this.order = { id: 'ASC' };
        this.limit = undefined;
        this.offset = undefined;
        this.relations = undefined;
    }
}
exports.FindDto = FindDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Выбор полей',
    }),
    __metadata("design:type", Object)
], FindDto.prototype, "select", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Выбор',
    }),
    __metadata("design:type", Object)
], FindDto.prototype, "where", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Поиск',
    }),
    __metadata("design:type", Object)
], FindDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Сортировка',
    }),
    __metadata("design:type", Object)
], FindDto.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Лимит',
    }),
    __metadata("design:type", Number)
], FindDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Число пропускаемых записей',
    }),
    __metadata("design:type", Number)
], FindDto.prototype, "offset", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Отношения',
    }),
    __metadata("design:type", Array)
], FindDto.prototype, "relations", void 0);
//# sourceMappingURL=find.dto.js.map