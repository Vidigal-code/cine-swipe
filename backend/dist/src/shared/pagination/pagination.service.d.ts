import { ConfigService } from '@nestjs/config';
import { PaginatedResult, PaginationParams, PaginationQueryInput } from './pagination.types';
export declare class PaginationService {
    private readonly configService;
    constructor(configService: ConfigService);
    resolve(query: PaginationQueryInput): PaginationParams;
    buildResult<T>(items: T[], total: number, params: PaginationParams): PaginatedResult<T>;
    private buildMeta;
    private toPositiveInt;
}
