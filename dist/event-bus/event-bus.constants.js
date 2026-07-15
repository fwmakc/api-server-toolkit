"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBusPattern = exports.EVENT_BUS = void 0;
exports.EVENT_BUS = "EVENT_BUS";
var EventBusPattern;
(function (EventBusPattern) {
    EventBusPattern["USER_REGISTERED"] = "user.registered";
    EventBusPattern["USER_CONFIRMED"] = "user.confirmed";
    EventBusPattern["PASSWORD_RESET"] = "password.reset";
    EventBusPattern["PASSWORD_CHANGED"] = "password.changed";
    EventBusPattern["ENTITY_CREATED"] = "entity.created";
    EventBusPattern["ENTITY_UPDATED"] = "entity.updated";
    EventBusPattern["ENTITY_REMOVED"] = "entity.removed";
    EventBusPattern["CHAT_MESSAGE_SENT"] = "chat.message.sent";
})(EventBusPattern || (exports.EventBusPattern = EventBusPattern = {}));
//# sourceMappingURL=event-bus.constants.js.map