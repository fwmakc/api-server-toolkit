"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Self = exports.Account = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
class JwtAccountGuard extends (0, passport_1.AuthGuard)('jwt') {
}
class JwtNoBlockAccountGuard extends (0, passport_1.AuthGuard)('jwt') {
    handleRequest(err, user) {
        return user;
    }
}
const Account = (apiType = undefined) => {
    if (apiType === 'noBlock') {
        return (0, common_1.applyDecorators)((0, common_1.UseGuards)(JwtNoBlockAccountGuard));
    }
    return (0, common_1.applyDecorators)((0, common_1.UseGuards)(JwtAccountGuard));
};
exports.Account = Account;
exports.Self = (0, common_1.createParamDecorator)(async (apiType = undefined, context) => {
    const request = context.switchToHttp().getRequest();
    const user = request === null || request === void 0 ? void 0 : request.user;
    if (apiType !== 'noBlock') {
        if (!user || (user === null || user === void 0 ? void 0 : user.id) === undefined) {
            throw new common_1.ForbiddenException('You have no rights!');
        }
    }
    return user;
});
//# sourceMappingURL=auth.decorator.js.map