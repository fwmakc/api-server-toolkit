"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FindOneDoc = void 0;
const common_1 = require("@nestjs/common");
const common_doc_1 = require("../common.doc");
const FindOneDoc = (classDto) => {
    return (0, common_1.applyDecorators)((0, common_doc_1.CommonDoc)({
        title: 'Найти запись по ее id',
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
                name: 'relations',
                description: 'Массив объектов с нужными связями',
                type: '[RelationsDto]',
                example: [{ name: 'table', order: 'id', desc: true }],
            },
        ],
    }));
};
exports.FindOneDoc = FindOneDoc;
//# sourceMappingURL=find_one.doc.js.map