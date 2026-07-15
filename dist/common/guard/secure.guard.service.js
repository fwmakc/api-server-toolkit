"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenValidate = tokenValidate;
exports.tokenValidateSimple = tokenValidateSimple;
const common_1 = require("@nestjs/common");
const dotenv = require("dotenv");
const crypt_service_1 = require("../service/crypt.service");
dotenv.config();
function tokenValidate(token) {
    if (!token) {
        throw new common_1.UnauthorizedException('Token is missing');
    }
    const [tokenHashed, tokenTimestamp] = token.split('.');
    const expires = Number(process.env.SECURE_EXPIRES);
    const string = `${process.env.SECURE_SECRET}.${tokenTimestamp}`;
    const method = `${process.env.SECURE_METHOD || 'MD5'}`.toLowerCase();
    const hashed = (0, crypt_service_1.hash)(string, method);
    if (hashed !== tokenHashed) {
        throw new common_1.UnauthorizedException('Token is invalid');
    }
    const timestamp = Date.now() / 1000;
    const expired = Number(timestamp) - Number(tokenTimestamp);
    if (expired < 0) {
        throw new common_1.UnauthorizedException('Token is fake');
    }
    if (expires && expired > expires) {
        throw new common_1.UnauthorizedException('Token is expired');
    }
    return true;
}
function tokenValidateSimple(token) {
    if (!token) {
        throw new common_1.UnauthorizedException('Token is missing');
    }
    const word = process.env.SECURE_SIMPLE;
    if (!word) {
        throw new common_1.UnauthorizedException('Token not set on server');
    }
    return token === word;
}
//# sourceMappingURL=secure.guard.service.js.map