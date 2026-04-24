import { Injectable } from '@nestjs/common';
import {
  RESPONSE_FIELD_KEYS,
  RESPONSE_STATUS_VALUES,
} from './response.constants';
import type {
  HealthResponse,
  PaginatedResponse,
  ReceivedResponse,
  SuccessResponse,
  UploadResponse,
  UserResponse,
} from './response.types';
import type { PaginationMeta } from '../pagination/pagination.types';

@Injectable()
export class ResponseFactory {
  resource<TResource>(resource: TResource): TResource {
    return resource;
  }

  user<TUser>(user: TUser): UserResponse<TUser> {
    return {
      [RESPONSE_FIELD_KEYS.user]: user,
    };
  }

  paginated<TItem>(result: PaginatedResponse<TItem>): PaginatedResponse<TItem>;
  paginated<TItem>(
    data: TItem[],
    meta: PaginationMeta,
  ): PaginatedResponse<TItem>;
  paginated<TItem>(
    resultOrData: PaginatedResponse<TItem> | TItem[],
    meta?: PaginationMeta,
  ): PaginatedResponse<TItem> {
    const paginatedResult = this.resolvePaginatedPayload(resultOrData, meta);
    return {
      [RESPONSE_FIELD_KEYS.data]: paginatedResult.data,
      [RESPONSE_FIELD_KEYS.meta]: paginatedResult.meta,
    };
  }

  upload(url: string): UploadResponse {
    return {
      [RESPONSE_FIELD_KEYS.url]: url,
    };
  }

  success(value = true): SuccessResponse {
    return {
      [RESPONSE_FIELD_KEYS.success]: value,
    };
  }

  received(): ReceivedResponse {
    return {
      [RESPONSE_FIELD_KEYS.received]: true,
    };
  }

  health(status = RESPONSE_STATUS_VALUES.ok): HealthResponse {
    return {
      [RESPONSE_FIELD_KEYS.status]: status,
    };
  }

  private resolvePaginatedPayload<TItem>(
    resultOrData: PaginatedResponse<TItem> | TItem[],
    meta?: PaginationMeta,
  ): PaginatedResponse<TItem> {
    if (Array.isArray(resultOrData)) {
      if (!meta) {
        throw new Error(
          'Pagination meta is required when data array is provided',
        );
      }
      return { data: resultOrData, meta };
    }

    return resultOrData;
  }
}
