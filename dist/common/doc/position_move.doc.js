"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovePositionDoc = void 0;
const common_1 = require("@nestjs/common");
const common_doc_1 = require("../common.doc");
const MovePositionDoc = () => {
    return (0, common_1.applyDecorators)((0, common_doc_1.CommonDoc)({
        title: 'Перемещение записи на новое место',
        success: Boolean,
        params: [
            {
                name: 'id',
                required: true,
                description: 'Id номер записи',
            },
        ],
        queries: [
            {
                name: 'field',
                description: 'Числовое поле для сортировки записей',
                type: 'string',
                example: 'position',
            },
            {
                name: 'position',
                description: 'Номер новой позиции',
                type: 'string',
                example: '5',
            },
        ],
    }));
};
exports.MovePositionDoc = MovePositionDoc;
//# sourceMappingURL=position_move.doc.js.map