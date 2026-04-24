"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditPurchase = exports.CreditPurchaseStatus = void 0;
var CreditPurchaseStatus;
(function (CreditPurchaseStatus) {
    CreditPurchaseStatus["PENDING"] = "PENDING";
    CreditPurchaseStatus["COMPLETED"] = "COMPLETED";
    CreditPurchaseStatus["FAILED"] = "FAILED";
})(CreditPurchaseStatus || (exports.CreditPurchaseStatus = CreditPurchaseStatus = {}));
class CreditPurchase {
    id;
    userId;
    creditPlanId;
    creditsAmount;
    amountBrl;
    status;
    provider;
    correlationId;
    stripePaymentIntentId;
    failureReason;
    createdAt;
    updatedAt;
}
exports.CreditPurchase = CreditPurchase;
//# sourceMappingURL=credit-purchase.entity.js.map