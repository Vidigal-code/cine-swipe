import { ConfigService } from '@nestjs/config';

export const DATABASE_PROVIDER_VALUES = [
  'postgres',
  'firestore',
  'realtime',
] as const;
export type DatabaseProvider = (typeof DATABASE_PROVIDER_VALUES)[number];

export const AUTH_MODE_VALUES = ['local', 'firebase', 'hybrid'] as const;
export type AuthMode = (typeof AUTH_MODE_VALUES)[number];

export const MEDIA_STORAGE_PROVIDER_VALUES = ['local', 'firebase'] as const;
export type MediaStorageProvider =
  (typeof MEDIA_STORAGE_PROVIDER_VALUES)[number];

export const PAYMENT_FLOW_VALUES = ['sync', 'rmq'] as const;
export type PaymentFlowMode = (typeof PAYMENT_FLOW_VALUES)[number];

export const PAYMENT_PROVIDER_VALUES = ['mock', 'stripe'] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDER_VALUES)[number];

export interface PlatformConfig {
  databaseProvider: DatabaseProvider;
  authMode: AuthMode;
  mediaStorageProvider: MediaStorageProvider;
  paymentFlowMode: PaymentFlowMode;
  paymentProvider: PaymentProvider;
}

const DISABLED_VALUES = new Set(['false', '0', 'off', 'no']);
const ENABLED_VALUES = new Set(['true', '1', 'on', 'yes']);

export function readPlatformConfig(
  configService: ConfigService,
): PlatformConfig {
  return {
    databaseProvider: resolveDatabaseProvider(configService),
    authMode: resolveAuthMode(configService),
    mediaStorageProvider: resolveMediaStorageProvider(configService),
    paymentFlowMode: resolvePaymentFlowMode(configService),
    paymentProvider: resolvePaymentProvider(configService),
  };
}

export function resolveDatabaseProvider(
  configService: ConfigService,
): DatabaseProvider {
  return resolveValue(
    configService.get<string>('DATABASE_PROVIDER'),
    DATABASE_PROVIDER_VALUES,
    'postgres',
  );
}

export function resolveAuthMode(configService: ConfigService): AuthMode {
  const rawMode =
    configService.get<string>('AUTH_MODE') ??
    configService.get<string>('AUTH_PROVIDER');
  return resolveValue(rawMode, AUTH_MODE_VALUES, 'local');
}

export function resolveMediaStorageProvider(
  configService: ConfigService,
): MediaStorageProvider {
  return resolveValue(
    configService.get<string>('MEDIA_STORAGE_PROVIDER'),
    MEDIA_STORAGE_PROVIDER_VALUES,
    'local',
  );
}

export function resolvePaymentFlowMode(
  configService: ConfigService,
): PaymentFlowMode {
  return resolveValue(
    configService.get<string>('PAYMENT_FLOW_MODE'),
    PAYMENT_FLOW_VALUES,
    'rmq',
  );
}

export function resolvePaymentProvider(
  configService: ConfigService,
): PaymentProvider {
  return resolveValue(
    configService.get<string>('PAYMENT_PROVIDER'),
    PAYMENT_PROVIDER_VALUES,
    'mock',
  );
}

export function isRmqPaymentFlow(configService: ConfigService): boolean {
  return resolvePaymentFlowMode(configService) === 'rmq';
}

export function isFirebaseAuthEnabled(configService: ConfigService): boolean {
  const mode = resolveAuthMode(configService);
  return mode === 'firebase' || mode === 'hybrid';
}

export function validatePlatformConfig(configService: ConfigService): void {
  const config = readPlatformConfig(configService);

  if (
    config.databaseProvider !== 'postgres' &&
    !hasFirebaseCredentialConfig(configService)
  ) {
    throw new Error(
      'Firebase credentials are required when DATABASE_PROVIDER is firestore or realtime',
    );
  }

  if (
    config.mediaStorageProvider === 'firebase' &&
    !hasFirebaseCredentialConfig(configService)
  ) {
    throw new Error(
      'Firebase credentials are required when MEDIA_STORAGE_PROVIDER=firebase',
    );
  }

  if (
    config.paymentProvider === 'stripe' &&
    !configService.get<string>('STRIPE_SECRET_KEY')
  ) {
    throw new Error(
      'STRIPE_SECRET_KEY is required when PAYMENT_PROVIDER=stripe',
    );
  }

  const appEnv = configService.get<string>('APP_ENV', 'local');
  if (appEnv !== 'local') {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret || jwtSecret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 chars outside local env');
    }
    const jweSecret = configService.get<string>('AUTH_JWE_SECRET');
    if (!jweSecret || jweSecret.length < 32) {
      throw new Error(
        'AUTH_JWE_SECRET must be at least 32 chars outside local env',
      );
    }
  }

  const csrfEnabled = readBoolean(
    configService.get<string>('CSRF_ENABLED'),
    true,
  );
  if (
    csrfEnabled &&
    configService.get<string>('AUTH_COOKIE_SAMESITE', 'lax') === 'none'
  ) {
    const secureCookie = readBoolean(
      configService.get<string>('AUTH_COOKIE_SECURE'),
      appEnv !== 'local',
    );
    if (!secureCookie) {
      throw new Error(
        'AUTH_COOKIE_SECURE must be true when AUTH_COOKIE_SAMESITE=none',
      );
    }
  }
}

export function hasFirebaseCredentialConfig(
  configService: ConfigService,
): boolean {
  const projectId = configService.get<string>('FIREBASE_PROJECT_ID');
  const clientEmail = configService.get<string>('FIREBASE_CLIENT_EMAIL');
  const privateKey = configService.get<string>('FIREBASE_PRIVATE_KEY');
  const serviceAccountJson = configService.get<string>(
    'FIREBASE_SERVICE_ACCOUNT_JSON',
  );

  return Boolean(
    (projectId && clientEmail && privateKey) ||
    (serviceAccountJson && serviceAccountJson.trim().length > 0),
  );
}

function resolveValue<T extends readonly string[]>(
  raw: string | undefined,
  options: T,
  fallback: T[number],
): T[number] {
  if (!raw) {
    return fallback;
  }
  const normalized = raw.trim().toLowerCase();
  const matched = options.find((option) => option === normalized);
  return matched ?? fallback;
}

function readBoolean(raw: string | undefined, fallback: boolean): boolean {
  if (!raw) {
    return fallback;
  }
  const normalized = raw.trim().toLowerCase();
  if (ENABLED_VALUES.has(normalized)) {
    return true;
  }
  if (DISABLED_VALUES.has(normalized)) {
    return false;
  }
  return fallback;
}
