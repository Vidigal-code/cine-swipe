import { User } from '../entities/user.entity';
import type { PaginationParams } from '../../../shared/pagination/pagination.types';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface IUserRepository {
  create(user: Partial<User>): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findByFirebaseUid(firebaseUid: string): Promise<User | null>;
  findByReferralCode(referralCode: string): Promise<User | null>;
  findPage(params: PaginationParams): Promise<{ items: User[]; total: number }>;
  countByRole(role: User['role']): Promise<number>;
  update(id: string, user: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
}
