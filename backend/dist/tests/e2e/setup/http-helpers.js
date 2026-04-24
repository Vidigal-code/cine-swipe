"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractCookies = extractCookies;
exports.mergeCookieJar = mergeCookieJar;
exports.toCookieHeader = toCookieHeader;
function extractCookies(response) {
    const setCookieHeader = response.headers['set-cookie'];
    const cookieLines = normalizeSetCookie(setCookieHeader);
    return cookieLines.reduce((accumulator, line) => {
        const [cookiePair] = line.split(';');
        const separatorIndex = cookiePair.indexOf('=');
        if (separatorIndex <= 0) {
            return accumulator;
        }
        const name = cookiePair.slice(0, separatorIndex).trim();
        const value = cookiePair.slice(separatorIndex + 1).trim();
        accumulator[name] = value;
        return accumulator;
    }, {});
}
function mergeCookieJar(jar, response) {
    return {
        ...jar,
        ...extractCookies(response),
    };
}
function toCookieHeader(cookies) {
    return Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
}
function normalizeSetCookie(setCookieHeader) {
    if (!setCookieHeader) {
        return [];
    }
    if (Array.isArray(setCookieHeader)) {
        return setCookieHeader;
    }
    return [setCookieHeader];
}
//# sourceMappingURL=http-helpers.js.map