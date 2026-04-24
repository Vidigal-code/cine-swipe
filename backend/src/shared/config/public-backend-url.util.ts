import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

export function buildPublicBackendUrl(
  configService: ConfigService,
  request: Request,
): string {
  const configuredBaseUrl = configService.get<string>('BACKEND_BASE_URL');
  if (configuredBaseUrl && configuredBaseUrl.trim().length > 0) {
    return configuredBaseUrl.replace(/\/+$/, '');
  }

  const forwardedProtocol = request.headers['x-forwarded-proto'];
  const protocol = Array.isArray(forwardedProtocol)
    ? forwardedProtocol[0]
    : (forwardedProtocol?.split(',')[0] ?? request.protocol);

  return `${protocol.trim()}://${request.get('host')}`;
}
