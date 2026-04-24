"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditPurchaseOutbox = exports.CreditPurchaseOutboxStatus = void 0;
var CreditPurchaseOutboxStatus;
(function (CreditPurchaseOutboxStatus) {
    CreditPurchaseOutboxStatus["PENDING"] = "PENDING";
    CreditPurchaseOutboxStatus["SENT"] = "SENT";
    CreditPurchaseOutboxStatus["FAILED"] = "FAILED";
})(CreditPurchaseOutboxStatus || (exports.CreditPurchaseOutboxStatus = CreditPurchaseOutboxStatus = {}));
class CreditPurchaseOutbox {
    id;
    creditPurchaseId;
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
exports.CreditPurchaseOutbox = CreditPurchaseOutbox;
//# sourceMappingURL=credit-purchase-outbox.entity.js.map