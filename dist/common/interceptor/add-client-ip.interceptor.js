"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddClientIpInterceptor = void 0;
const common_1 = require("@nestjs/common");
const request_ip_1 = require("@supercharge/request-ip");
let AddClientIpInterceptor = class AddClientIpInterceptor {
    constructor(key = 'ip') {
        this.key = key;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        request.body[this.key] = (0, request_ip_1.getClientIp)(request);
        return next.handle();
    }
};
exports.AddClientIpInterceptor = AddClientIpInterceptor;
exports.AddClientIpInterceptor = AddClientIpInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [String])
], AddClientIpInterceptor);
//# sourceMappingURL=add-client-ip.interceptor.js.map