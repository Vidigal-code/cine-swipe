import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PaginatedResult,
  PaginationMeta,
  PaginationParams,
  PaginationQueryInput,
} from './pagination.types';

@Injectable()
export class PaginationService {
  constructor(private readonly configService: ConfigService) {}

  resolve(query: PaginationQueryInput): PaginationParams {
    const page = this.toPositiveInt(
      query.page,
      this.configService.get<number>('PAGINATION_DEFAULT_PAGE', 1),
    );
    const requestedLimit = this.toPositiveInt(
      query.limit,
      this.configService.get<number>('PAGINATION_DEFAULT_LIMIT', 12),
    );
    const maxLimit = this.configService.get<number>('PAGINATION_MAX_LIMIT', 50);
    const limit = Math.min(requestedLimit, maxLimit);

    return {
      page,
      limit,
      skip: (page - 1) * limit,
    };
  }

  buildResult<T>(
    items: T[],
    total: number,
    params: PaginationParams,
  ): PaginatedResult<T> {
    return {
      data: items,
      meta: this.buildMeta(total, params),
    };
  }

  private buildMeta(total: number, params: PaginationParams): PaginationMeta {
    const totalPages = Math.max(1, Math.ceil(total / params.limit));
    return {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNextPage: params.page < totalPages,
      hasPreviousPage: params.page > 1,
    };
  }

  private toPositiveInt(
    value: string | number | undefined,
    fallback: number,
  ): number {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return Math.floor(value);
    }

    if (typeof value === 'string') {
      const parsedValue = Number.parseInt(value, 10);
      if (!Number.isNaN(parsedValue) && parsedValue > 0) {
        return parsedValue;
      }
    }

    return fallback;
  }
}
