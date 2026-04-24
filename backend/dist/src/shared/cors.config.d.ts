import { ConfigService } from '@nestjs/config';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
export declare function buildCorsOptions(configService: ConfigService): CorsOptions;
