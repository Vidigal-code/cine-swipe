"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditTransaction = exports.CreditTransactionType = void 0;
var CreditTransactionType;
(function (CreditTransactionType) {
    CreditTransactionType["REGISTRATION_BONUS"] = "REGISTRATION_BONUS";
    CreditTransactionType["REFEREE_REGISTRATION_BONUS"] = "REFEREE_REGISTRATION_BONUS";
    CreditTransactionType["REFERRER_FIRST_PURCHASE_BONUS"] = "REFERRER_FIRST_PURCHASE_BONUS";
    CreditTransactionType["CREDIT_PURCHASE"] = "CREDIT_PURCHASE";
    CreditTransactionType["CREDIT_CONSUMPTION"] = "CREDIT_CONSUMPTION";
    CreditTransactionType["ADMIN_ADJUSTMENT"] = "ADMIN_ADJUSTMENT";
})(CreditTransactionType || (exports.CreditTransactionType = CreditTransactionType = {}));
class CreditTransaction {
    id;
    userId;
    type;
    amount;
    balanceBefore;
    balanceAfter;
    description;
    correlationId;
    metadata;
    createdAt;
}
exports.CreditTransaction = CreditTransaction;
//# sourceMappingURL=credit-transaction.entity.js.map