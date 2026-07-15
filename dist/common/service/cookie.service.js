"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cookie = void 0;
class Cookie {
    constructor(request, response) {
        this.request = request;
        this.response = response;
    }
    set(name, data) {
        this.response.cookie(name, data, {
            httpOnly: true,
            path: '/',
            secure: false,
        });
    }
    setJson(name, data) {
        this.response.cookie(name, JSON.stringify(data), {
            httpOnly: true,
            path: '/',
            secure: false,
        });
    }
    get(name) {
        return this.request.cookies[name];
    }
    getJson(name) {
        return JSON.parse(this.request.cookies[name] || 'null');
    }
    reset(name) {
        this.response.clearCookie(name);
    }
}
exports.Cookie = Cookie;
//# sourceMappingURL=cookie.service.js.map