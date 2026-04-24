"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReferralCode = generateReferralCode;
const crypto_1 = require("crypto");
const REFERRAL_CODE_PREFIX = 'ref_';
const REFERRAL_CODE_RANDOM_BYTES = 6;
function generateReferralCode() {
    return `${REFERRAL_CODE_PREFIX}${(0, crypto_1.randomBytes)(REFERRAL_CODE_RANDOM_BYTES).toString('hex')}`;
}
//# sourceMappingURL=referral-code.util.js.map