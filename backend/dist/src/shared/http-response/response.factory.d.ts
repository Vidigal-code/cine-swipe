import type { HealthResponse, PaginatedResponse, ReceivedResponse, SuccessResponse, UploadResponse, UserResponse } from './response.types';
import type { PaginationMeta } from '../pagination/pagination.types';
export declare class ResponseFactory {
    resource<TResource>(resource: TResource): TResource;
    user<TUser>(user: TUser): UserResponse<TUser>;
    paginated<TItem>(result: PaginatedResponse<TItem>): PaginatedResponse<TItem>;
    paginated<TItem>(data: TItem[], meta: PaginationMeta): PaginatedResponse<TItem>;
    upload(url: string): UploadResponse;
    success(value?: boolean): SuccessResponse;
    received(): ReceivedResponse;
    health(status?: "ok"): HealthResponse;
    private resolvePaginatedPayload;
}
