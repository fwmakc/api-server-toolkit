"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleSecure = exports.Secure = exports.Doc = exports.Data = void 0;
const common_1 = require("@nestjs/common");
const find_doc_1 = require("./doc/find.doc");
const find_one_doc_1 = require("./doc/find_one.doc");
const find_first_doc_1 = require("./doc/find_first.doc");
const find_many_doc_1 = require("./doc/find_many.doc");
const self_doc_1 = require("./doc/self.doc");
const count_doc_1 = require("./doc/count.doc");
const create_doc_1 = require("./doc/create.doc");
const update_doc_1 = require("./doc/update.doc");
const remove_doc_1 = require("./doc/remove.doc");
const position_sort_doc_1 = require("./doc/position_sort.doc");
const position_move_doc_1 = require("./doc/position_move.doc");
const secure_guard_1 = require("./guard/secure.guard");
const simple_secure_guard_1 = require("./guard/simple.secure.guard");
exports.Data = (0, common_1.createParamDecorator)(async (arg = '', context) => {
    const request = context.switchToHttp().getRequest();
    const { body, query } = request;
    const data = { ...query, ...body };
    let result = arg ? data[arg] : data;
    if (typeof result === 'string') {
        try {
            result = JSON.parse(result);
        }
        catch { }
    }
    return result;
});
const Doc = (type, classDto) => {
    if (type === 'find') {
        return (0, common_1.applyDecorators)((0, find_doc_1.FindDoc)(classDto));
    }
    if (type === 'findOne') {
        return (0, common_1.applyDecorators)((0, find_one_doc_1.FindOneDoc)(classDto));
    }
    if (type === 'findFirst') {
        return (0, common_1.applyDecorators)((0, find_first_doc_1.FindFirstDoc)(classDto));
    }
    if (type === 'findMany') {
        return (0, common_1.applyDecorators)((0, find_many_doc_1.FindManyDoc)(classDto));
    }
    if (type === 'self') {
        return (0, common_1.applyDecorators)((0, self_doc_1.SelfDoc)(classDto));
    }
    if (type === 'count') {
        return (0, common_1.applyDecorators)((0, count_doc_1.CountDoc)(classDto));
    }
    if (type === 'create') {
        return (0, common_1.applyDecorators)((0, create_doc_1.CreateDoc)(classDto));
    }
    if (type === 'update') {
        return (0, common_1.applyDecorators)((0, update_doc_1.UpdateDoc)(classDto));
    }
    if (type === 'remove') {
        return (0, common_1.applyDecorators)((0, remove_doc_1.RemoveDoc)());
    }
    if (type === 'sortPosition') {
        return (0, common_1.applyDecorators)((0, position_sort_doc_1.SortPositionDoc)(classDto));
    }
    if (type === 'movePosition') {
        return (0, common_1.applyDecorators)((0, position_move_doc_1.MovePositionDoc)());
    }
};
exports.Doc = Doc;
const Secure = () => {
    return (0, common_1.applyDecorators)((0, common_1.UseGuards)(secure_guard_1.SecureGuard));
};
exports.Secure = Secure;
const SimpleSecure = () => {
    return (0, common_1.applyDecorators)((0, common_1.UseGuards)(simple_secure_guard_1.SimpleSecureGuard));
};
exports.SimpleSecure = SimpleSecure;
//# sourceMappingURL=common.decorator.js.map