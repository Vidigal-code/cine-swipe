import { User, UserRole } from '../../domain/user/entities/user.entity';
import { type IUserRepository } from '../../domain/user/interfaces/user.repository';
import { PaginationService } from '../../shared/pagination/pagination.service';
import type { PaginatedResult, PaginationQueryInput } from '../../shared/pagination/pagination.types';
interface CreateAdminUserInput {
    username: string;
    email: string;
    password: string;
    role?: UserRole;
}
interface UpdateAdminUserInput {
    username?: string;
    email?: string;
}
export declare class AdminUserService {
    private readonly userRepository;
    private readonly paginationService;
    constructor(userRepository: IUserRepository, paginationService: PaginationService);
    listUsers(query: PaginationQueryInput): Promise<PaginatedResult<Omit<User, 'passwordHash'>>>;
    createUser(input: CreateAdminUserInput): Promise<Omit<User, 'passwordHash'>>;
    updateUser(id: string, input: UpdateAdminUserInput): Promise<Omit<User, 'passwordHash'>>;
    updateUserRole(targetUserId: string, role: UserRole, actorUserId: string): Promise<Omit<User, 'passwordHash'>>;
    deleteUser(targetUserId: string, actorUserId: string): Promise<void>;
    private getUserOrThrow;
    private assertEmailAvailable;
    private assertUsernameAvailable;
    private ensureStrongPassword;
    private ensureActorAvailable;
    private assertCanDeleteUser;
    private assertCanChangeRole;
    private assertLastAdminProtection;
    private ensureAdminCountAllowsChange;
    private removeSensitiveFields;
}
export {};
