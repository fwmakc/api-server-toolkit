"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemovePrivateFieldsInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const private_fields_service_1 = require("../service/private_fields.service");
let RemovePrivateFieldsInterceptor = class RemovePrivateFieldsInterceptor {
    intercept(context, next) {
        var _a;
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const bind = {
            allow: (_a = user === null || user === void 0 ? void 0 : user.isSuperuser) !== null && _a !== void 0 ? _a : false,
            id: user === null || user === void 0 ? void 0 : user.id,
            key: 'id',
            name: 'account',
        };
        return next
            .handle()
            .pipe((0, rxjs_1.map)((result) => (0, private_fields_service_1.removePrivateFields)(result, bind)));
    }
};
exports.RemovePrivateFieldsInterceptor = RemovePrivateFieldsInterceptor;
exports.RemovePrivateFieldsInterceptor = RemovePrivateFieldsInterceptor = __decorate([
    (0, common_1.Injectable)()
], RemovePrivateFieldsInterceptor);
//# sourceMappingURL=remove-private.interceptor.js.map