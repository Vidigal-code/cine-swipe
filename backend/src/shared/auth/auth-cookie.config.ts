import { ConfigService } from '@nestjs/config';
import type { CookieOptions } from 'express';

export const ACCESS_TOKEN_COOKIE = 'cine_access_token';
export const REFRESH_TOKEN_COOKIE = 'cine_refresh_token';
export const CSRF_TOKEN_COOKIE = 'cine_csrf_token';
export const CSRF_HEADER_NAME = 'x-csrf-token';

const DEFAULT_ACCESS_COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const DEFAULT_REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const DISABLED_VALUES = new Set(['false', '0', 'off', 'no']);

type CookieType = 'access' | 'refresh' | 'csrf';

export function buildCookieOptions(
  configService: ConfigService,
  type: CookieType,
): CookieOptions {
  const secure = readBoolean(
    configService,
    'AUTH_COOKIE_SECURE',
    configService.get<string>('APP_ENV', 'local') !== 'local',
  );
  const sameSite = resolveSameSite(
    configService.get<string>('AUTH_COOKIE_SAMESITE', 'lax'),
  );
  const domain = configService.get<string>('AUTH_COOKIE_DOMAIN');

  return {
    httpOnly: type !== 'csrf',
    secure,
    sameSite,
    path: '/',
    domain: domain || undefined,
    maxAge:
      type === 'access'
        ? resolveAccessCookieMaxAge(configService)
        : resolveRefreshCookieMaxAge(configService),
  };
}

export function csrfEnabled(configService: ConfigService): boolean {
  return readBoolean(configService, 'CSRF_ENABLED', true);
}

function resolveSameSite(value: string): CookieOptions['sameSite'] {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'strict' || normalized === 'none') {
    return normalized;
  }
  return 'lax';
}

function resolveAccessCookieMaxAge(configService: ConfigService): number {
  return resolvePositiveNumber(
    configService.get<number>('AUTH_ACCESS_COOKIE_MAX_AGE_MS'),
    DEFAULT_ACCESS_COOKIE_MAX_AGE_MS,
  );
}

function resolveRefreshCookieMaxAge(configService: ConfigService): number {
  return resolvePositiveNumber(
    configService.get<number>('AUTH_REFRESH_COOKIE_MAX_AGE_MS'),
    DEFAULT_REFRESH_COOKIE_MAX_AGE_MS,
  );
}

function resolvePositiveNumber(
  value: number | undefined,
  fallback: number,
): number {
  if (!value || Number.isNaN(value) || value <= 0) {
    return fallback;
  }
  return value;
}

function readBoolean(
  configService: ConfigService,
  key: string,
  fallback: boolean,
): boolean {
  const raw = configService.get<string>(key);
  if (!raw) {
    return fallback;
  }
  return !DISABLED_VALUES.has(raw.trim().toLowerCase());
}
