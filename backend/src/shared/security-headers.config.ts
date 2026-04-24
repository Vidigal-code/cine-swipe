import { ConfigService } from '@nestjs/config';
import type { HelmetOptions } from 'helmet';

const HSTS_MAX_AGE_SECONDS = 15552000;
const DEFAULT_CSP_DIRECTIVES = {
  defaultSrc: ["'self'"],
  baseUri: ["'self'"],
  frameAncestors: ["'none'"],
  imgSrc: ["'self'", 'data:', 'https:'],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  connectSrc: ["'self'"],
  objectSrc: ["'none'"],
} as const;

export function buildHelmetOptions(
  configService: ConfigService,
): HelmetOptions {
  const cspEnabled = readBoolean(configService, 'CSP_ENABLED', true);
  const cspReportOnly = readBoolean(configService, 'CSP_REPORT_ONLY', false);

  return {
    contentSecurityPolicy: cspEnabled
      ? {
          useDefaults: false,
          reportOnly: cspReportOnly,
          directives: {
            ...DEFAULT_CSP_DIRECTIVES,
            connectSrc: resolveConnectSrc(configService),
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-site' },
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'no-referrer' },
    hidePoweredBy: true,
    hsts: {
      maxAge: HSTS_MAX_AGE_SECONDS,
      includeSubDomains: true,
      preload: false,
    },
  };
}

function resolveConnectSrc(configService: ConfigService): string[] {
  const configured = configService.get<string>('CSP_CONNECT_SRC', '');
  if (!configured) {
    return [...DEFAULT_CSP_DIRECTIVES.connectSrc];
  }

  const parsed = configured
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  return parsed.length > 0 ? parsed : [...DEFAULT_CSP_DIRECTIVES.connectSrc];
}

function readBoolean(
  configService: ConfigService,
  key: string,
  fallback: boolean,
): boolean {
  const value = configService.get<string>(key);
  if (!value) {
    return fallback;
  }
  return !['false', '0', 'off', 'no'].includes(value.trim().toLowerCase());
}
