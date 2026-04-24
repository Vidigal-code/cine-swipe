"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSRF_HEADER_NAME = exports.CSRF_TOKEN_COOKIE = exports.REFRESH_TOKEN_COOKIE = exports.ACCESS_TOKEN_COOKIE = void 0;
exports.buildCookieOptions = buildCookieOptions;
exports.csrfEnabled = csrfEnabled;
exports.ACCESS_TOKEN_COOKIE = 'cine_access_token';
exports.REFRESH_TOKEN_COOKIE = 'cine_refresh_token';
exports.CSRF_TOKEN_COOKIE = 'cine_csrf_token';
exports.CSRF_HEADER_NAME = 'x-csrf-token';
const DEFAULT_ACCESS_COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const DEFAULT_REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const DISABLED_VALUES = new Set(['false', '0', 'off', 'no']);
function buildCookieOptions(configService, type) {
    const secure = readBoolean(configService, 'AUTH_COOKIE_SECURE', configService.get('APP_ENV', 'local') !== 'local');
    const sameSite = resolveSameSite(configService.get('AUTH_COOKIE_SAMESITE', 'lax'));
    const domain = configService.get('AUTH_COOKIE_DOMAIN');
    return {
        httpOnly: type !== 'csrf',
        secure,
        sameSite,
        path: '/',
        domain: domain || undefined,
        maxAge: type === 'access' ? resolveAccessCookieMaxAge(configService) : resolveRefreshCookieMaxAge(configService),
    };
}
function csrfEnabled(configService) {
    return readBoolean(configService, 'CSRF_ENABLED', true);
}
function resolveSameSite(value) {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'strict' || normalized === 'none') {
        return normalized;
    }
    return 'lax';
}
function resolveAccessCookieMaxAge(configService) {
    return resolvePositiveNumber(configService.get('AUTH_ACCESS_COOKIE_MAX_AGE_MS'), DEFAULT_ACCESS_COOKIE_MAX_AGE_MS);
}
function resolveRefreshCookieMaxAge(configService) {
    return resolvePositiveNumber(configService.get('AUTH_REFRESH_COOKIE_MAX_AGE_MS'), DEFAULT_REFRESH_COOKIE_MAX_AGE_MS);
}
function resolvePositiveNumber(value, fallback) {
    if (!value || Number.isNaN(value) || value <= 0) {
        return fallback;
    }
    return value;
}
function readBoolean(configService, key, fallback) {
    const raw = configService.get(key);
    if (!raw) {
        return fallback;
    }
    return !DISABLED_VALUES.has(raw.trim().toLowerCase());
}
//# sourceMappingURL=auth-cookie.config.js.map