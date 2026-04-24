import { ConfigService } from '@nestjs/config';

export function readPositiveIntConfig(
  configService: ConfigService,
  key: string,
  fallback: number,
): number {
  return parsePositiveInt(configService.get<string | number>(key), fallback);
}

export function parsePositiveInt(
  rawValue: string | number | undefined,
  fallback: number,
): number {
  const parsed =
    typeof rawValue === 'number'
      ? rawValue
      : Number.parseInt((rawValue ?? '').toString(), 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}
