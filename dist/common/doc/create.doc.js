"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateDoc = void 0;
const common_1 = require("@nestjs/common");
const common_doc_1 = require("../common.doc");
const CreateDoc = (classDto) => {
    return (0, common_1.applyDecorators)((0, common_doc_1.CommonDoc)({
        title: 'Создать запись',
        models: [classDto],
        success: classDto,
        relations: true,
        queries: [
            {
                name: 'create',
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
exports.CreateDoc = CreateDoc;
//# sourceMappingURL=create.doc.js.map