"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonDoc = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const relations_dto_1 = require("./dto/relations.dto");
const CommonDoc = ({ title, models = undefined, success = undefined, relations = false, queries = undefined, params = undefined, }) => {
    const decorators = [];
    decorators.push((0, swagger_1.ApiOperation)({ summary: title }));
    if (queries) {
        queries.forEach((query) => {
            if (query.required === undefined) {
                query.required = false;
            }
            if (!query.required) {
                query.type = `${query.type || ''}${query.type ? ', ' : ''}необязательный`;
            }
            if (query.example) {
                query.example = JSON.stringify(query.example);
            }
            decorators.push((0, swagger_1.ApiQuery)(query));
        });
    }
    if (params) {
        params.reverse().forEach((param) => {
            if (!param.required) {
                param.required = false;
            }
            if (!param.required) {
                param.type = `${param.type ? `${param.type}, ` : ''}необязательный`;
            }
            if (param.example) {
                param.example = JSON.stringify(param.example);
            }
            decorators.push((0, swagger_1.ApiParam)(param));
        });
    }
    if (relations) {
        if (!(models === null || models === void 0 ? void 0 : models.length)) {
            models = [];
        }
        models.push(relations_dto_1.RelationsDto);
    }
    if (models === null || models === void 0 ? void 0 : models.length) {
        decorators.push((0, swagger_1.ApiExtraModels)(...models));
        const anyOf = [];
        models.forEach((model) => {
            anyOf.push({ $ref: (0, swagger_1.getSchemaPath)(model) });
        });
        decorators.push((0, swagger_1.ApiBody)({ schema: { anyOf } }));
    }
    decorators.push((0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Выполнено',
        type: success,
    }));
    decorators.push((0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Ошибка',
    }));
    return (0, common_1.applyDecorators)(...decorators);
};
exports.CommonDoc = CommonDoc;
//# sourceMappingURL=common.doc.js.map