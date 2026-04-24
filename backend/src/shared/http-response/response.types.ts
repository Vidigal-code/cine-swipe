import type { PaginatedResult } from '../pagination/pagination.types';

export type UserResponse<TUser> = { user: TUser };
export type UploadResponse = { url: string };
export type SuccessResponse = { success: boolean };
export type ReceivedResponse = { received: true };
export type HealthResponse = { status: string };

export type PaginatedResponse<TItem> = PaginatedResult<TItem>;
