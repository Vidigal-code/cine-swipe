import { ConfigService } from '@nestjs/config';
import { resolveDatabaseProvider } from '../../shared/config/platform.config';

export function pickDatabaseRepository<T>(
  configService: ConfigService,
  providers: {
    postgres: T;
    firebase: T;
  },
): T {
  const provider = resolveDatabaseProvider(configService);
  return provider === 'postgres' ? providers.postgres : providers.firebase;
}
