"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FindDoc = void 0;
const common_1 = require("@nestjs/common");
const common_doc_1 = require("../common.doc");
const FindDoc = (classDto) => {
    return (0, common_1.applyDecorators)((0, common_doc_1.CommonDoc)({
        title: 'Найти все записи',
        models: [classDto],
        success: [classDto],
        relations: true,
        queries: [
            {
                name: 'select',
                description: 'Объект выборкой полей, которые будут возвращаться, если не нужны все поля',
                type: classDto.name,
                example: { id: true },
            },
            {
                name: 'where',
                description: 'Объект с нужными полями записей и их значениями, по которым записи будут фильтроваться',
                type: classDto.name,
                example: { id: 1 },
            },
            {
                name: 'order',
                description: 'Объект с полями записи и значением ASC/DESC, для сортировки записей по этим полям',
                example: { id: 'DESC' },
            },
            {
                name: 'limit',
                description: 'Число записей, которые будут получены',
                example: 0,
            },
            {
                name: 'offset',
                description: 'Число записей, которые будут пропущены',
                example: 0,
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
exports.FindDoc = FindDoc;
//# sourceMappingURL=find.doc.js.map