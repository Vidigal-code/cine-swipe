import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../domain/user/entities/user.entity';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../domain/user/interfaces/user.repository';
import { PaginationService } from '../../shared/pagination/pagination.service';
import type {
  PaginatedResult,
  PaginationQueryInput,
} from '../../shared/pagination/pagination.types';
import {
  STRONG_PASSWORD_MESSAGE,
  STRONG_PASSWORD_REGEX,
} from '../../shared/auth/password-policy';
import { ADMIN_USER_MESSAGES_PT_BR } from '../../shared/user/admin-user-messages.pt-br';

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

@Injectable()
export class AdminUserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly paginationService: PaginationService,
  ) {}

  async listUsers(
    query: PaginationQueryInput,
  ): Promise<PaginatedResult<Omit<User, 'passwordHash'>>> {
    const pagination = this.paginationService.resolve(query);
    const { items, total } = await this.userRepository.findPage(pagination);
    const users = items.map((user) => this.removeSensitiveFields(user));
    return this.paginationService.buildResult(users, total, pagination);
  }

  async createUser(
    input: CreateAdminUserInput,
  ): Promise<Omit<User, 'passwordHash'>> {
    await this.assertEmailAvailable(input.email);
    await this.assertUsernameAvailable(input.username);
    this.ensureStrongPassword(input.password);

    const createdUser = await this.userRepository.create({
      username: input.username,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, 10),
      role: input.role ?? UserRole.USER,
    });

    return this.removeSensitiveFields(createdUser);
  }

  async updateUser(
    id: string,
    input: UpdateAdminUserInput,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.getUserOrThrow(id);

    if (input.email && input.email !== user.email) {
      await this.assertEmailAvailable(input.email, user.id);
    }
    if (input.username && input.username !== user.username) {
      await this.assertUsernameAvailable(input.username, user.id);
    }

    const updatedUser = await this.userRepository.update(user.id, {
      username: input.username ?? user.username,
      email: input.email ?? user.email,
    });
    return this.removeSensitiveFields(updatedUser);
  }

  async updateUserRole(
    targetUserId: string,
    role: UserRole,
    actorUserId: string,
  ): Promise<Omit<User, 'passwordHash'>> {
    this.ensureActorAvailable(actorUserId);

    const user = await this.getUserOrThrow(targetUserId);
    await this.assertCanChangeRole(user, role, actorUserId);

    const updatedUser = await this.userRepository.update(user.id, { role });
    return this.removeSensitiveFields(updatedUser);
  }

  async deleteUser(targetUserId: string, actorUserId: string): Promise<void> {
    this.ensureActorAvailable(actorUserId);

    const user = await this.getUserOrThrow(targetUserId);
    await this.assertCanDeleteUser(user, actorUserId);

    await this.userRepository.delete(user.id);
  }

  private async getUserOrThrow(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(ADMIN_USER_MESSAGES_PT_BR.userNotFound);
    }
    return user;
  }

  private async assertEmailAvailable(
    email: string,
    exceptUserId?: string,
  ): Promise<void> {
    const existing = await this.userRepository.findByEmail(email);
    if (existing && existing.id !== exceptUserId) {
      throw new ConflictException(ADMIN_USER_MESSAGES_PT_BR.emailAlreadyInUse);
    }
  }

  private async assertUsernameAvailable(
    username: string,
    exceptUserId?: string,
  ): Promise<void> {
    const existing = await this.userRepository.findByUsername(username);
    if (existing && existing.id !== exceptUserId) {
      throw new ConflictException(
        ADMIN_USER_MESSAGES_PT_BR.usernameAlreadyInUse,
      );
    }
  }

  private ensureStrongPassword(password: string): void {
    if (!STRONG_PASSWORD_REGEX.test(password)) {
      throw new BadRequestException(STRONG_PASSWORD_MESSAGE);
    }
  }

  private ensureActorAvailable(actorUserId: string): void {
    if (!actorUserId) {
      throw new BadRequestException(ADMIN_USER_MESSAGES_PT_BR.actorRequired);
    }
  }

  private async assertCanDeleteUser(
    user: User,
    actorUserId: string,
  ): Promise<void> {
    if (user.id === actorUserId) {
      throw new BadRequestException(
        ADMIN_USER_MESSAGES_PT_BR.cannotDeleteYourself,
      );
    }
    await this.assertLastAdminProtection(user.role, UserRole.USER);
  }

  private async assertCanChangeRole(
    user: User,
    requestedRole: UserRole,
    actorUserId: string,
  ): Promise<void> {
    if (user.id === actorUserId) {
      throw new BadRequestException(
        ADMIN_USER_MESSAGES_PT_BR.cannotChangeOwnRole,
      );
    }
    await this.assertLastAdminProtection(user.role, requestedRole);
  }

  private async assertLastAdminProtection(
    currentRole: UserRole,
    nextRole: UserRole,
  ): Promise<void> {
    if (!(currentRole === UserRole.ADMIN && nextRole !== UserRole.ADMIN)) {
      return;
    }

    await this.ensureAdminCountAllowsChange();
  }

  private async ensureAdminCountAllowsChange(): Promise<void> {
    const adminCount = await this.userRepository.countByRole(UserRole.ADMIN);
    if (adminCount <= 1) {
      throw new BadRequestException(
        ADMIN_USER_MESSAGES_PT_BR.cannotRemoveLastAdmin,
      );
    }
  }

  private removeSensitiveFields(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
