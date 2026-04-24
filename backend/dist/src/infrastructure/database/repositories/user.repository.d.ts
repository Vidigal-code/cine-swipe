import { IUserRepository } from '../../../domain/user/interfaces/user.repository';
import { User } from '../../../domain/user/entities/user.entity';
import { PrismaService } from '../prisma.service';
import type { PaginationParams } from '../../../shared/pagination/pagination.types';
export declare class PrismaUserRepository implements IUserRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(userData: Partial<User>): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    findByFirebaseUid(firebaseUid: string): Promise<User | null>;
    findByReferralCode(referralCode: string): Promise<User | null>;
    findPage(params: PaginationParams): Promise<{
        items: User[];
        total: number;
    }>;
    countByRole(role: User['role']): Promise<number>;
    update(id: string, user: Partial<User>): Promise<User>;
    delete(id: string): Promise<void>;
    private toCreateInput;
    private resolveUsername;
    private resolveReferralCode;
    private findUniqueAsDomain;
    private toUpdateInput;
    private toPrismaRole;
    private toDomain;
}
