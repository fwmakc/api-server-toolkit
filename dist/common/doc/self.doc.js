"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelfDoc = void 0;
const common_1 = require("@nestjs/common");
const common_doc_1 = require("../common.doc");
const SelfDoc = (classDto) => {
    return (0, common_1.applyDecorators)((0, common_doc_1.CommonDoc)({
        title: 'Найти записи, принадлежащие учетной записи пользователя',
        models: [classDto],
        success: [classDto],
        relations: true,
        queries: [
            {
                name: 'where',
                description: 'Объект с нужными полями записи и их значениями, по которым запись будет выбираться',
                type: classDto.name,
                example: { id: 1 },
            },
            {
                name: 'order',
                description: 'Объект с полями записи и значением ASC/DESC, для сортировки записей по этим полям',
                example: { id: 'DESC' },
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
exports.SelfDoc = SelfDoc;
//# sourceMappingURL=self.doc.js.map