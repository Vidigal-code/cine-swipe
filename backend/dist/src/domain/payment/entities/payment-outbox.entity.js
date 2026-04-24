"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentOutbox = exports.PaymentOutboxStatus = void 0;
var PaymentOutboxStatus;
(function (PaymentOutboxStatus) {
    PaymentOutboxStatus["PENDING"] = "PENDING";
    PaymentOutboxStatus["SENT"] = "SENT";
    PaymentOutboxStatus["FAILED"] = "FAILED";
})(PaymentOutboxStatus || (exports.PaymentOutboxStatus = PaymentOutboxStatus = {}));
class PaymentOutbox {
    id;
    purchaseId;
    eventType;
    payload;
    status;
    attempts;
    nextAttemptAt;
    lastError;
    publishedAt;
    createdAt;
    updatedAt;
}
exports.PaymentOutbox = PaymentOutbox;
//# sourceMappingURL=payment-outbox.entity.js.map