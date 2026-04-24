import { ConfigService } from '@nestjs/config';
export declare function readPositiveIntConfig(configService: ConfigService, key: string, fallback: number): number;
export declare function parsePositiveInt(rawValue: string | number | undefined, fallback: number): number;
