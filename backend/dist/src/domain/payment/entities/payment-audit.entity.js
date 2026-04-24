"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentAudit = exports.PaymentAuditSource = exports.PaymentAuditEventType = void 0;
var PaymentAuditEventType;
(function (PaymentAuditEventType) {
    PaymentAuditEventType["CHECKOUT_REQUESTED"] = "CHECKOUT_REQUESTED";
    PaymentAuditEventType["STATUS_UPDATED"] = "STATUS_UPDATED";
    PaymentAuditEventType["RETRY_SCHEDULED"] = "RETRY_SCHEDULED";
    PaymentAuditEventType["DLQ_MOVED"] = "DLQ_MOVED";
    PaymentAuditEventType["WEBHOOK_DUPLICATE_IGNORED"] = "WEBHOOK_DUPLICATE_IGNORED";
})(PaymentAuditEventType || (exports.PaymentAuditEventType = PaymentAuditEventType = {}));
var PaymentAuditSource;
(function (PaymentAuditSource) {
    PaymentAuditSource["API"] = "API";
    PaymentAuditSource["WORKER"] = "WORKER";
    PaymentAuditSource["WEBHOOK"] = "WEBHOOK";
    PaymentAuditSource["SYSTEM"] = "SYSTEM";
})(PaymentAuditSource || (exports.PaymentAuditSource = PaymentAuditSource = {}));
class PaymentAudit {
    id;
    purchaseId;
    userId;
    userName;
    userEmail;
    movieId;
    movieTitle;
    amount;
    provider;
    status;
    correlationId;
    stripePaymentIntentId;
    eventType;
    source;
    message;
    createdAt;
}
exports.PaymentAudit = PaymentAudit;
//# sourceMappingURL=payment-audit.entity.js.map