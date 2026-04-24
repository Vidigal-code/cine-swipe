import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IUserRepository } from '../../../domain/user/interfaces/user.repository';
import {
  User,
  UserRole as DomainUserRole,
} from '../../../domain/user/entities/user.entity';
import { PrismaService } from '../prisma.service';
import type { PaginationParams } from '../../../shared/pagination/pagination.types';

const DEFAULT_USER_VALUES = {
  username: '',
  email: '',
  role: DomainUserRole.USER,
  creditsBalance: 0,
} as const;

type UserUpdateInput = {
  username?: string;
  email?: string;
  passwordHash?: string | null;
  firebaseUid?: string | null;
  role?: DomainUserRole;
  creditsBalance?: number;
  avatarUrl?: string | null;
  referralCode?: string;
  referredByUserId?: string | null;
  firstApprovedCreditPurchaseDone?: boolean;
  referralSignupBonusGranted?: boolean;
};

type UserUniqueWhere =
  | { id: string }
  | { email: string }
  | { username: string }
  | { firebaseUid: string }
  | { referralCode: string };

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userData: Partial<User>): Promise<User> {
    const createdUser = await this.prisma.user.create({
      data: this.toCreateInput(userData),
    });

    return this.toDomain(createdUser);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findUniqueAsDomain({ email });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.findUniqueAsDomain({ username });
  }

  async findById(id: string): Promise<User | null> {
    return this.findUniqueAsDomain({ id });
  }

  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    return this.findUniqueAsDomain({ firebaseUid });
  }

  async findByReferralCode(referralCode: string): Promise<User | null> {
    return this.findUniqueAsDomain({ referralCode });
  }

  async findPage(
    params: PaginationParams,
  ): Promise<{ items: User[]; total: number }> {
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip: params.skip,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      items: users.map((user) => this.toDomain(user)),
      total,
    };
  }

  async countByRole(role: User['role']): Promise<number> {
    return this.prisma.user.count({
      where: {
        role: this.toPrismaRole(role),
      },
    });
  }

  async update(id: string, user: Partial<User>): Promise<User> {
    const updated = await this.prisma.user.update({
      where: { id },
      data: this.toUpdateInput(user),
    });
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  private toCreateInput(userData: Partial<User>) {
    return {
      username: this.resolveUsername(userData),
      email: userData.email ?? DEFAULT_USER_VALUES.email,
      passwordHash: userData.passwordHash ?? null,
      firebaseUid: userData.firebaseUid ?? null,
      role: this.toPrismaRole(userData.role),
      creditsBalance:
        userData.creditsBalance ?? DEFAULT_USER_VALUES.creditsBalance,
      avatarUrl: userData.avatarUrl ?? null,
      referralCode: this.resolveReferralCode(userData),
      referredByUserId: userData.referredByUserId ?? null,
      firstApprovedCreditPurchaseDone:
        userData.firstApprovedCreditPurchaseDone ?? false,
      referralSignupBonusGranted: userData.referralSignupBonusGranted ?? false,
    };
  }

  private resolveUsername(userData: Partial<User>): string {
    return userData.username ?? userData.email ?? DEFAULT_USER_VALUES.username;
  }

  private resolveReferralCode(userData: Partial<User>): string {
    if (userData.referralCode && userData.referralCode.trim().length > 0) {
      return userData.referralCode;
    }
    return `ref_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
  }

  private async findUniqueAsDomain(
    where: UserUniqueWhere,
  ): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where });
    return user ? this.toDomain(user) : null;
  }

  private toUpdateInput(user: Partial<User>): UserUpdateInput {
    return {
      username: user.username,
      email: user.email,
      passwordHash: user.passwordHash,
      firebaseUid: user.firebaseUid,
      role: user.role ? this.toPrismaRole(user.role) : undefined,
      creditsBalance: user.creditsBalance,
      avatarUrl: user.avatarUrl,
      referralCode: user.referralCode,
      referredByUserId: user.referredByUserId,
      firstApprovedCreditPurchaseDone: user.firstApprovedCreditPurchaseDone,
      referralSignupBonusGranted: user.referralSignupBonusGranted,
    };
  }

  private toPrismaRole(role: User['role'] | undefined): DomainUserRole {
    return role ?? DEFAULT_USER_VALUES.role;
  }

  private toDomain(user: {
    id: string;
    username: string;
    email: string;
    passwordHash: string | null;
    firebaseUid: string | null;
    role: string;
    creditsBalance: number;
    avatarUrl: string | null;
    referralCode: string;
    referredByUserId: string | null;
    firstApprovedCreditPurchaseDone: boolean;
    referralSignupBonusGranted: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      passwordHash: user.passwordHash,
      firebaseUid: user.firebaseUid,
      role: user.role as DomainUserRole,
      creditsBalance: user.creditsBalance,
      avatarUrl: user.avatarUrl,
      referralCode: user.referralCode,
      referredByUserId: user.referredByUserId,
      firstApprovedCreditPurchaseDone: user.firstApprovedCreditPurchaseDone,
      referralSignupBonusGranted: user.referralSignupBonusGranted,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
