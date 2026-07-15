"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveDoc = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const RemoveDoc = () => {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiOperation)({
        summary: 'Удалить запись по ее id',
    }), (0, swagger_1.ApiParam)({
        name: 'id',
        required: true,
        description: 'Id номер записи',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Выполнено',
        type: Boolean,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Ошибка',
    }));
};
exports.RemoveDoc = RemoveDoc;
//# sourceMappingURL=remove.doc.js.map