"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateDoc = void 0;
const common_1 = require("@nestjs/common");
const common_doc_1 = require("../common.doc");
const UpdateDoc = (classDto) => {
    return (0, common_1.applyDecorators)((0, common_doc_1.CommonDoc)({
        title: 'Обновить запись по ее id',
        models: [classDto],
        success: classDto,
        relations: true,
        params: [
            {
                name: 'id',
                required: true,
                description: 'Id номер записи',
            },
        ],
        queries: [
            {
                name: 'update',
                description: 'Объект с нужными полями записей и их значениями, по которым записи будут фильтроваться',
                type: classDto.name,
            },
            {
                name: 'relations',
                description: 'Массив объектов с нужными связями',
                type: '[RelationsDto]',
                example: [{ name: 'table', order: 'id', desc: true }],
            },
        ],
    }));
};
exports.UpdateDoc = UpdateDoc;
//# sourceMappingURL=update.doc.js.map