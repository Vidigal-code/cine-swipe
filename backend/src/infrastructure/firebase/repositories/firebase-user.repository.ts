import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IUserRepository } from '../../../domain/user/interfaces/user.repository';
import { User, UserRole } from '../../../domain/user/entities/user.entity';
import type { PaginationParams } from '../../../shared/pagination/pagination.types';
import { FirebaseStateStoreService } from '../firebase-state-store.service';
import {
  createUuid,
  nowIso,
  paginateDescendingByCreatedAt,
  toDate,
} from '../firebase-state.utils';
import { FirebaseUserRecord } from '../firebase-state.types';

@Injectable()
export class FirebaseUserRepository implements IUserRepository {
  constructor(private readonly stateStore: FirebaseStateStoreService) {}

  async create(userData: Partial<User>): Promise<User> {
    return this.stateStore.runStateTransaction((state) => {
      const id = userData.id ?? createUuid();
      const createdAt = nowIso();
      const referralCode = this.resolveReferralCode(
        state.users,
        userData.referralCode,
      );
      const record: FirebaseUserRecord = {
        id,
        username: userData.username ?? userData.email ?? '',
        email: userData.email ?? '',
        passwordHash: userData.passwordHash ?? null,
        firebaseUid: userData.firebaseUid ?? null,
        role: userData.role ?? UserRole.USER,
        creditsBalance: userData.creditsBalance ?? 0,
        avatarUrl: userData.avatarUrl ?? null,
        referralCode,
        referredByUserId: userData.referredByUserId ?? null,
        firstApprovedCreditPurchaseDone:
          userData.firstApprovedCreditPurchaseDone ?? false,
        referralSignupBonusGranted:
          userData.referralSignupBonusGranted ?? false,
        createdAt,
        updatedAt: createdAt,
      };
      state.users[id] = record;
      return this.toDomain(record);
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const state = await this.stateStore.readState();
    return this.findByField(state.users, (user) => user.email === email);
  }

  async findByUsername(username: string): Promise<User | null> {
    const state = await this.stateStore.readState();
    return this.findByField(state.users, (user) => user.username === username);
  }

  async findById(id: string): Promise<User | null> {
    const state = await this.stateStore.readState();
    const user = state.users[id];
    return user ? this.toDomain(user) : null;
  }

  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    const state = await this.stateStore.readState();
    return this.findByField(
      state.users,
      (user) => user.firebaseUid === firebaseUid,
    );
  }

  async findByReferralCode(referralCode: string): Promise<User | null> {
    const state = await this.stateStore.readState();
    return this.findByField(
      state.users,
      (user) => user.referralCode === referralCode,
    );
  }

  async findPage(
    params: PaginationParams,
  ): Promise<{ items: User[]; total: number }> {
    const state = await this.stateStore.readState();
    const paginated = paginateDescendingByCreatedAt(
      Object.values(state.users),
      params,
    );
    return {
      items: paginated.items.map((item) => this.toDomain(item)),
      total: paginated.total,
    };
  }

  async countByRole(role: User['role']): Promise<number> {
    const state = await this.stateStore.readState();
    const expectedRole = String(role);
    return Object.values(state.users).filter(
      (user) => user.role === expectedRole,
    ).length;
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    return this.stateStore.runStateTransaction((state) => {
      const existing = state.users[id];
      if (!existing) {
        throw new Error('USER_NOT_FOUND');
      }
      const updated: FirebaseUserRecord = {
        ...existing,
        username: userData.username ?? existing.username,
        email: userData.email ?? existing.email,
        passwordHash:
          userData.passwordHash !== undefined
            ? userData.passwordHash
            : existing.passwordHash,
        firebaseUid:
          userData.firebaseUid !== undefined
            ? userData.firebaseUid
            : existing.firebaseUid,
        role: userData.role ?? existing.role,
        creditsBalance: userData.creditsBalance ?? existing.creditsBalance,
        avatarUrl:
          userData.avatarUrl !== undefined
            ? userData.avatarUrl
            : existing.avatarUrl,
        referralCode: userData.referralCode ?? existing.referralCode,
        referredByUserId:
          userData.referredByUserId !== undefined
            ? userData.referredByUserId
            : existing.referredByUserId,
        firstApprovedCreditPurchaseDone:
          userData.firstApprovedCreditPurchaseDone ??
          existing.firstApprovedCreditPurchaseDone,
        referralSignupBonusGranted:
          userData.referralSignupBonusGranted ??
          existing.referralSignupBonusGranted,
        updatedAt: nowIso(),
      };
      state.users[id] = updated;
      return this.toDomain(updated);
    });
  }

  async delete(id: string): Promise<void> {
    await this.stateStore.runStateTransaction((state) => {
      delete state.users[id];
      return true;
    });
  }

  private findByField(
    users: Record<string, FirebaseUserRecord>,
    predicate: (user: FirebaseUserRecord) => boolean,
  ): User | null {
    const found = Object.values(users).find(predicate);
    return found ? this.toDomain(found) : null;
  }

  private resolveReferralCode(
    users: Record<string, FirebaseUserRecord>,
    desiredCode: string | undefined,
  ): string {
    const hasCode = (code: string): boolean =>
      Object.values(users).some((user) => user.referralCode === code);

    if (desiredCode && desiredCode.trim().length > 0 && !hasCode(desiredCode)) {
      return desiredCode;
    }

    let generated = this.generateReferralCode();
    while (hasCode(generated)) {
      generated = this.generateReferralCode();
    }
    return generated;
  }

  private generateReferralCode(): string {
    return `ref_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
  }

  private toDomain(record: FirebaseUserRecord): User {
    return {
      id: record.id,
      username: record.username,
      email: record.email,
      passwordHash: record.passwordHash,
      firebaseUid: record.firebaseUid,
      role: record.role as UserRole,
      creditsBalance: record.creditsBalance,
      avatarUrl: record.avatarUrl,
      referralCode: record.referralCode,
      referredByUserId: record.referredByUserId,
      firstApprovedCreditPurchaseDone: record.firstApprovedCreditPurchaseDone,
      referralSignupBonusGranted: record.referralSignupBonusGranted,
      createdAt: toDate(record.createdAt),
      updatedAt: toDate(record.updatedAt),
    };
  }
}
