"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MP_STATUS_MAP = void 0;
exports.mapMercadoPagoSubscriptionStatus = mapMercadoPagoSubscriptionStatus;
exports.dateFromUnixSeconds = dateFromUnixSeconds;
exports.MP_STATUS_MAP = {
    authorized: "active",
    paused: "paused",
    cancelled: "cancelled",
    pending: "pending",
};
function mapMercadoPagoSubscriptionStatus(status) {
    var _a;
    if (!status)
        return "pending";
    return (_a = exports.MP_STATUS_MAP[status]) !== null && _a !== void 0 ? _a : "pending";
}
function dateFromUnixSeconds(timestamp) {
    return timestamp ? new Date(timestamp * 1000) : null;
}
