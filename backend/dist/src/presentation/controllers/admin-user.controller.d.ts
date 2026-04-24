import type { Request } from 'express';
import { AdminUserService } from '../../application/admin-user/admin-user.service';
import { User } from '../../domain/user/entities/user.entity';
import { ResponseFactory } from '../../shared/http-response/response.factory';
import type { PaginatedResponse, SuccessResponse } from '../../shared/http-response/response.types';
import { PaginationQueryDto } from '../../shared/pagination/pagination-query.dto';
import { CreateAdminUserDto } from './dto/admin-user/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/admin-user/update-admin-user.dto';
import { UpdateAdminUserRoleDto } from './dto/admin-user/update-admin-user-role.dto';
type AuthenticatedRequest = Request & {
    user?: {
        sub?: string;
    };
};
export declare class AdminUserController {
    private readonly adminUserService;
    private readonly responseFactory;
    constructor(adminUserService: AdminUserService, responseFactory: ResponseFactory);
    listUsers(query: PaginationQueryDto): Promise<PaginatedResponse<Omit<User, 'passwordHash'>>>;
    createUser(body: CreateAdminUserDto): Promise<Omit<User, 'passwordHash'>>;
    updateUser(id: string, body: UpdateAdminUserDto): Promise<Omit<User, 'passwordHash'>>;
    updateUserRole(id: string, request: AuthenticatedRequest, body: UpdateAdminUserRoleDto): Promise<Omit<User, 'passwordHash'>>;
    deleteUser(id: string, request: AuthenticatedRequest): Promise<SuccessResponse>;
}
export {};
