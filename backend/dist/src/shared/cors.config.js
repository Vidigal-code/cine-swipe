"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCorsOptions = buildCorsOptions;
const DEFAULT_FRONTEND_ORIGIN = 'http://localhost:3000';
function buildCorsOptions(configService) {
    const allowedOrigins = resolveAllowedOrigins(configService);
    return {
        origin: allowedOrigins,
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'X-CSRF-Token',
            'x-csrf-token',
        ],
        credentials: true,
        optionsSuccessStatus: 204,
    };
}
function resolveAllowedOrigins(configService) {
    const fromList = configService.get('CORS_ALLOWED_ORIGINS', '');
    const apiOrigin = configService.get('NEXT_PUBLIC_API_URL', '');
    const frontendOrigin = configService.get('NEXT_PUBLIC_FRONTEND_URL', DEFAULT_FRONTEND_ORIGIN);
    const origins = [
        ...parseOriginList(fromList),
        frontendOrigin,
        normalizeApiToFrontendOrigin(apiOrigin),
    ].filter((origin) => Boolean(origin));
    return [...new Set(origins)];
}
function parseOriginList(value) {
    if (!value) {
        return [];
    }
    return value
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
}
function normalizeApiToFrontendOrigin(apiUrl) {
    if (!apiUrl) {
        return '';
    }
    try {
        const parsedUrl = new URL(apiUrl);
        if (parsedUrl.port === '3001') {
            parsedUrl.port = '3000';
        }
        parsedUrl.pathname = '';
        parsedUrl.search = '';
        parsedUrl.hash = '';
        return parsedUrl.toString().replace(/\/$/, '');
    }
    catch {
        return '';
    }
}
//# sourceMappingURL=cors.config.js.map