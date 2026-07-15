"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FindManyDoc = void 0;
const common_1 = require("@nestjs/common");
const common_doc_1 = require("../common.doc");
const FindManyDoc = (classDto) => {
    return (0, common_1.applyDecorators)((0, common_doc_1.CommonDoc)({
        title: 'Найти записи по нескольким id',
        success: [classDto],
        relations: true,
        params: [
            {
                name: 'ids',
                required: true,
                description: 'Id номера записей через запятую',
                example: '1,2,3',
            },
        ],
        queries: [
            {
                name: 'select',
                description: 'Объект выборкой полей, которые будут возвращаться, если не нужны все поля',
                type: classDto.name,
                example: { id: true },
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
exports.FindManyDoc = FindManyDoc;
//# sourceMappingURL=find_many.doc.js.map