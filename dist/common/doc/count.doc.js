"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CountDoc = void 0;
const common_1 = require("@nestjs/common");
const common_doc_1 = require("../common.doc");
const CountDoc = (classDto) => {
    return (0, common_1.applyDecorators)((0, common_doc_1.CommonDoc)({
        title: 'Подсчитать количество записей',
        models: [classDto],
        success: [classDto],
        relations: true,
        queries: [
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
exports.CountDoc = CountDoc;
//# sourceMappingURL=count.doc.js.map