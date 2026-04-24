import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
export declare function buildPublicBackendUrl(configService: ConfigService, request: Request): string;
