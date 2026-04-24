"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["USER"] = "USER";
})(UserRole || (exports.UserRole = UserRole = {}));
class User {
    id;
    username;
    email;
    passwordHash;
    firebaseUid;
    role;
    creditsBalance;
    avatarUrl;
    referralCode;
    referredByUserId;
    firstApprovedCreditPurchaseDone;
    referralSignupBonusGranted;
    createdAt;
    updatedAt;
}
exports.User = User;
//# sourceMappingURL=user.entity.js.map