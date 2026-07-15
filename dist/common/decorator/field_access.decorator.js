"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FIELD_ACCESS_METADATA = void 0;
exports.FieldAccess = FieldAccess;
exports.FIELD_ACCESS_METADATA = 'fieldAccess';
function FieldAccess(options) {
    return function (target, propertyKey) {
        Reflect.defineMetadata(exports.FIELD_ACCESS_METADATA, options, target, propertyKey);
    };
}
//# sourceMappingURL=field_access.decorator.js.map