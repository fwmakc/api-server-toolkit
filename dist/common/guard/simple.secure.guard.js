"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleSecureGuard = void 0;
const common_1 = require("@nestjs/common");
const secure_guard_service_1 = require("./secure.guard.service");
let SimpleSecureGuard = class SimpleSecureGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const token = request.headers['authorization'];
        return (0, secure_guard_service_1.tokenValidateSimple)(token);
    }
};
exports.SimpleSecureGuard = SimpleSecureGuard;
exports.SimpleSecureGuard = SimpleSecureGuard = __decorate([
    (0, common_1.Injectable)()
], SimpleSecureGuard);
//# sourceMappingURL=simple.secure.guard.js.map