"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiLogger = void 0;
const common_1 = require("@nestjs/common");
const DISABLED_VALUES = new Set(['false', '0', 'off', 'no']);
const DEFAULT_LOGGER_ENABLED = true;
const DEFAULT_LOG_CONTEXT = 'Application';
class ApiLogger {
    static log(message, context = DEFAULT_LOG_CONTEXT) {
        if (!this.isEnabled()) {
            return;
        }
        common_1.Logger.log(message, context);
    }
    static warn(message, context = DEFAULT_LOG_CONTEXT) {
        if (!this.isEnabled()) {
            return;
        }
        common_1.Logger.warn(message, context);
    }
    static error(message, context = DEFAULT_LOG_CONTEXT) {
        if (!this.isEnabled()) {
            return;
        }
        common_1.Logger.error(message, context);
    }
    static debug(message, context = DEFAULT_LOG_CONTEXT) {
        if (!this.isEnabled()) {
            return;
        }
        common_1.Logger.debug(message, context);
    }
    static isEnabled() {
        const rawValue = process.env.APP_LOGGER_ENABLED;
        if (!rawValue) {
            return DEFAULT_LOGGER_ENABLED;
        }
        return !DISABLED_VALUES.has(rawValue.trim().toLowerCase());
    }
}
exports.ApiLogger = ApiLogger;
//# sourceMappingURL=api-logger.js.map