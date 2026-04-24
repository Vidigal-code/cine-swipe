"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STRONG_PASSWORD_MESSAGE = exports.STRONG_PASSWORD_REGEX = void 0;
const auth_messages_pt_br_1 = require("./auth-messages.pt-br");
exports.STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;
exports.STRONG_PASSWORD_MESSAGE = auth_messages_pt_br_1.AUTH_MESSAGES_PT_BR.strongPasswordPolicy;
//# sourceMappingURL=password-policy.js.map