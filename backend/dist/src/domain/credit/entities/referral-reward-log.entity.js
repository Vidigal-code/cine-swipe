"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralRewardLog = exports.ReferralRewardType = void 0;
var ReferralRewardType;
(function (ReferralRewardType) {
    ReferralRewardType["REFEREE_REGISTRATION"] = "REFEREE_REGISTRATION";
    ReferralRewardType["REFERRER_FIRST_PURCHASE"] = "REFERRER_FIRST_PURCHASE";
})(ReferralRewardType || (exports.ReferralRewardType = ReferralRewardType = {}));
class ReferralRewardLog {
    id;
    referrerUserId;
    refereeUserId;
    rewardType;
    creditsGranted;
    correlationId;
    createdAt;
}
exports.ReferralRewardLog = ReferralRewardLog;
//# sourceMappingURL=referral-reward-log.entity.js.map