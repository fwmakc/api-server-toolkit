"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.hash = hash;
const node_crypto_1 = require("node:crypto");
const dotenv = require("dotenv");
const common_1 = require("@nestjs/common");
dotenv.config();
async function encrypt(data) {
    const key = process.env.AES_SECRET;
    try {
        const iv = await node_crypto_1.webcrypto.getRandomValues(new Uint8Array(12));
        const cryptoKey = await node_crypto_1.webcrypto.subtle.importKey('raw', new Uint8Array(key.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))), { name: 'AES-GCM' }, false, ['encrypt']);
        const encrypted = await node_crypto_1.webcrypto.subtle.encrypt({
            name: 'AES-GCM',
            iv,
        }, cryptoKey, new TextEncoder().encode(data));
        return {
            encrypted: Array.from(new Uint8Array(encrypted))
                .map((byte) => byte.toString(16).padStart(2, '0'))
                .join(''),
            iv: Array.from(iv)
                .map((byte) => byte.toString(16).padStart(2, '0'))
                .join(''),
        };
    }
    catch (e) {
        throw new common_1.BadRequestException(`Error encrypting data: ${e.message}`);
    }
}
async function decrypt(encryptedData, iv) {
    const key = process.env.AES_SECRET;
    try {
        const cryptoKey = await node_crypto_1.webcrypto.subtle.importKey('raw', new Uint8Array(key.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))), { name: 'AES-GCM' }, false, ['decrypt']);
        const decrypted = await node_crypto_1.webcrypto.subtle.decrypt({
            name: 'AES-GCM',
            iv: new Uint8Array(iv.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))),
        }, cryptoKey, new Uint8Array(encryptedData.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))));
        return new TextDecoder().decode(new Uint8Array(decrypted));
    }
    catch (e) {
        throw new common_1.BadRequestException(`Error decrypting data: ${e.message}`);
    }
}
function hash(data, type = 'md5') {
    return (0, node_crypto_1.createHash)(type).update(data).copy().digest('hex');
}
//# sourceMappingURL=crypt.service.js.map