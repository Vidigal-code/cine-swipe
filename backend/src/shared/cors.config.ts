import { ConfigService } from '@nestjs/config';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const DEFAULT_FRONTEND_ORIGIN = 'http://localhost:3000';

export function buildCorsOptions(configService: ConfigService): CorsOptions {
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

function resolveAllowedOrigins(configService: ConfigService): string[] {
  const fromList = configService.get<string>('CORS_ALLOWED_ORIGINS', '');
  const apiOrigin = configService.get<string>('NEXT_PUBLIC_API_URL', '');
  const frontendOrigin = configService.get<string>(
    'NEXT_PUBLIC_FRONTEND_URL',
    DEFAULT_FRONTEND_ORIGIN,
  );

  const origins = [
    ...parseOriginList(fromList),
    frontendOrigin,
    normalizeApiToFrontendOrigin(apiOrigin),
  ].filter((origin): origin is string => Boolean(origin));

  return [...new Set(origins)];
}

function parseOriginList(value: string): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function normalizeApiToFrontendOrigin(apiUrl: string): string {
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
  } catch {
    return '';
  }
}
