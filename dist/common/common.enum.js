"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeValues = exports.TypeResponses = exports.TypeGrants = exports.TypeGenders = exports.TypeClients = void 0;
var TypeClients;
(function (TypeClients) {
    TypeClients["DEFAULT"] = "public";
    TypeClients["CONFIDENTIAL"] = "confidential";
})(TypeClients || (exports.TypeClients = TypeClients = {}));
var TypeGenders;
(function (TypeGenders) {
    TypeGenders["DEFAULT"] = "";
    TypeGenders["MAN"] = "m";
    TypeGenders["WOMAN"] = "w";
})(TypeGenders || (exports.TypeGenders = TypeGenders = {}));
var TypeGrants;
(function (TypeGrants) {
    TypeGrants["PASSWORD"] = "password";
    TypeGrants["REFRESH_TOKEN"] = "refresh_token";
    TypeGrants["AUTHORIZATION_CODE"] = "authorization_code";
    TypeGrants["CLIENT_CREDENTIALS"] = "client_credentials";
    TypeGrants["KEY"] = "key";
})(TypeGrants || (exports.TypeGrants = TypeGrants = {}));
var TypeResponses;
(function (TypeResponses) {
    TypeResponses["TOKEN"] = "token";
    TypeResponses["CODE"] = "code";
})(TypeResponses || (exports.TypeResponses = TypeResponses = {}));
var TypeValues;
(function (TypeValues) {
    TypeValues["DEFAULT"] = "";
    TypeValues["BOOLEAN"] = "boolean";
    TypeValues["JSON"] = "json";
    TypeValues["NUMBER"] = "number";
    TypeValues["STRING"] = "string";
})(TypeValues || (exports.TypeValues = TypeValues = {}));
//# sourceMappingURL=common.enum.js.map