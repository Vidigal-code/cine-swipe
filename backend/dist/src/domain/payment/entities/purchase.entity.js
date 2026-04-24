"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Purchase = exports.PurchaseStatus = void 0;
var PurchaseStatus;
(function (PurchaseStatus) {
    PurchaseStatus["PENDING"] = "PENDING";
    PurchaseStatus["COMPLETED"] = "COMPLETED";
    PurchaseStatus["FAILED"] = "FAILED";
})(PurchaseStatus || (exports.PurchaseStatus = PurchaseStatus = {}));
class Purchase {
    id;
    user;
    userId;
    movie;
    movieId;
    amount;
    status;
    provider;
    correlationId;
    stripePaymentIntentId;
    failureReason;
    createdAt;
    updatedAt;
}
exports.Purchase = Purchase;
//# sourceMappingURL=purchase.entity.js.map