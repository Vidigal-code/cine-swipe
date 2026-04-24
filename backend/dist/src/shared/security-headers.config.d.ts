import { ConfigService } from '@nestjs/config';
import type { HelmetOptions } from 'helmet';
export declare function buildHelmetOptions(configService: ConfigService): HelmetOptions;
