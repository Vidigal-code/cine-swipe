"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readPositiveIntConfig = readPositiveIntConfig;
exports.parsePositiveInt = parsePositiveInt;
function readPositiveIntConfig(configService, key, fallback) {
    return parsePositiveInt(configService.get(key), fallback);
}
function parsePositiveInt(rawValue, fallback) {
    const parsed = typeof rawValue === 'number'
        ? rawValue
        : Number.parseInt((rawValue ?? '').toString(), 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return fallback;
    }
    return Math.floor(parsed);
}
//# sourceMappingURL=env-number.util.js.map