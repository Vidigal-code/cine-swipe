"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPublicBackendUrl = buildPublicBackendUrl;
function buildPublicBackendUrl(configService, request) {
    const configuredBaseUrl = configService.get('BACKEND_BASE_URL');
    if (configuredBaseUrl && configuredBaseUrl.trim().length > 0) {
        return configuredBaseUrl.replace(/\/+$/, '');
    }
    const forwardedProtocol = request.headers['x-forwarded-proto'];
    const protocol = Array.isArray(forwardedProtocol)
        ? forwardedProtocol[0]
        : forwardedProtocol?.split(',')[0] ?? request.protocol;
    return `${protocol.trim()}://${request.get('host')}`;
}
//# sourceMappingURL=public-backend-url.util.js.map