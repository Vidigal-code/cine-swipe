import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { EncryptJWT, jwtDecrypt } from 'jose';
import { createHash, randomBytes } from 'crypto';

import { USER_REPOSITORY } from '../../domain/user/interfaces/user.repository';
import type { IUserRepository } from '../../domain/user/interfaces/user.repository';
import { User, UserRole } from '../../domain/user/entities/user.entity';
import { AuthProviderService } from './auth-provider.service';
import {
  STRONG_PASSWORD_MESSAGE,
  STRONG_PASSWORD_REGEX,
} from '../../shared/auth/password-policy';
import { AUTH_MESSAGES_PT_BR } from '../../shared/auth/auth-messages.pt-br';
import { generateReferralCode } from '../../shared/auth/referral-code.util';
import { CreditService } from '../credit/credit.service';
import { CREDIT_MESSAGES_PT_BR } from '../../shared/credit/credit-messages.pt-br';

interface AuthUserPayload {
  sub: string;
  username: string;
  email: string;
  role: UserRole;
}

interface RegisterInput {
  username?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  firebaseIdToken?: string;
  referralCode?: string;
}

interface LoginInput {
  email?: string;
  password?: string;
  firebaseIdToken?: string;
}

interface AuthResult {
  user: Omit<User, 'passwordHash'>;
  token: string;
  accessToken: string;
  sessionToken: string;
  csrfToken: string;
}

interface UpdateProfileInput {
  username?: string;
  email?: string;
}

interface RegistrationContext {
  referralCode: string;
  referredByUserId: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authProviderService: AuthProviderService,
    private readonly creditService: CreditService,
  ) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const provider = this.authProviderService.getAuthProvider();
    const role = this.resolveRole(input.role, input.email);
    const registrationContext = await this.resolveRegistrationContext(input);

    const registrationResult =
      provider === 'firebase'
        ? await this.registerWithFirebase(input, role, registrationContext)
        : {
            user: await this.registerWithLocalCredentials(
              input,
              role,
              registrationContext,
            ),
            isNewlyCreated: true,
          };

    if (registrationResult.isNewlyCreated) {
      await this.creditService.applyRegistrationBonuses(
        registrationResult.user.id,
      );
    }

    return this.buildAuthResult(registrationResult.user);
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const provider = this.authProviderService.getAuthProvider();
    const user =
      provider === 'firebase'
        ? await this.loginWithFirebase(input)
        : await this.loginWithLocalCredentials(input);

    return this.buildAuthResult(user);
  }

  async refresh(sessionToken: string): Promise<AuthResult> {
    if (!sessionToken) {
      throw new UnauthorizedException(AUTH_MESSAGES_PT_BR.sessionTokenRequired);
    }

    const payload = await this.decryptSessionToken(sessionToken);
    const user = await this.userRepository.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException(AUTH_MESSAGES_PT_BR.sessionNoLongerValid);
    }

    return this.buildAuthResult(user);
  }

  async getProfile(userId: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException(
        AUTH_MESSAGES_PT_BR.userSessionNoLongerValid,
      );
    }
    return this.removeSensitiveFields(user);
  }

  async updateProfile(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException(
        AUTH_MESSAGES_PT_BR.userSessionNoLongerValid,
      );
    }

    if (input.email && input.email !== user.email) {
      const existing = await this.userRepository.findByEmail(input.email);
      if (existing && existing.id !== user.id) {
        throw new ConflictException(AUTH_MESSAGES_PT_BR.emailAlreadyInUse);
      }
    }

    const updated = await this.userRepository.update(user.id, {
      username: input.username ?? user.username,
      email: input.email ?? user.email,
    });

    return this.removeSensitiveFields(updated);
  }

  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException(
        AUTH_MESSAGES_PT_BR.userSessionNoLongerValid,
      );
    }

    if (!user.passwordHash) {
      throw new BadRequestException(
        AUTH_MESSAGES_PT_BR.passwordUpdateNotAvailable,
      );
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException(
        AUTH_MESSAGES_PT_BR.currentPasswordInvalid,
      );
    }

    this.ensureStrongPassword(newPassword);
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(user.id, { passwordHash });
  }

  async updateAvatar(
    userId: string,
    avatarUrl: string,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException(
        AUTH_MESSAGES_PT_BR.userSessionNoLongerValid,
      );
    }
    const updated = await this.userRepository.update(user.id, { avatarUrl });
    return this.removeSensitiveFields(updated);
  }

  private async registerWithLocalCredentials(
    input: RegisterInput,
    role: UserRole,
    registrationContext: RegistrationContext,
  ): Promise<User> {
    const { email, password } = this.ensureLocalCredentials(input);

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictException(AUTH_MESSAGES_PT_BR.emailAlreadyInUse);
    }

    this.ensureStrongPassword(password);
    const passwordHash = await bcrypt.hash(password, 10);
    return this.userRepository.create({
      username: input.username ?? this.buildUsername(email),
      email,
      passwordHash,
      role,
      referralCode: registrationContext.referralCode,
      referredByUserId: registrationContext.referredByUserId,
    });
  }

  private async registerWithFirebase(
    input: RegisterInput,
    role: UserRole,
    registrationContext: RegistrationContext,
  ): Promise<{ user: User; isNewlyCreated: boolean }> {
    const firebaseIdToken = this.ensureFirebaseIdToken(input.firebaseIdToken);
    return this.authProviderService.resolveOrCreateFirebaseUser(
      firebaseIdToken,
      {
        requestedRole: role,
        referralCode: registrationContext.referralCode,
        referredByUserId: registrationContext.referredByUserId,
      },
    );
  }

  private async loginWithLocalCredentials(input: LoginInput): Promise<User> {
    const { email, password } = this.ensureLocalCredentials(input);

    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.passwordHash) {
      this.throwInvalidCredentials();
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      this.throwInvalidCredentials();
    }

    return user;
  }

  private async loginWithFirebase(input: LoginInput): Promise<User> {
    const firebaseIdToken = this.ensureFirebaseIdToken(input.firebaseIdToken);
    const result =
      await this.authProviderService.resolveOrCreateFirebaseUser(
        firebaseIdToken,
      );
    if (result.isNewlyCreated) {
      await this.creditService.applyRegistrationBonuses(result.user.id);
    }
    return result.user;
  }

  private async buildAuthResult(user: User): Promise<AuthResult> {
    const payload = this.buildUserPayload(user);
    const accessToken = this.jwtService.sign(payload);
    const sessionToken = await this.encryptSessionToken(payload);
    const csrfToken = this.createCsrfToken();
    const sanitizedUser = this.removeSensitiveFields(user);

    return {
      user: sanitizedUser,
      token: accessToken,
      accessToken,
      sessionToken,
      csrfToken,
    };
  }

  private buildUserPayload(user: User): AuthUserPayload {
    return {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
  }

  private createCsrfToken(): string {
    return randomBytes(24).toString('hex');
  }

  private async encryptSessionToken(payload: AuthUserPayload): Promise<string> {
    return new EncryptJWT(payload as unknown as Record<string, unknown>)
      .setProtectedHeader({ alg: 'dir', enc: 'A256GCM', typ: 'JWE' })
      .setIssuedAt()
      .setExpirationTime(this.getSessionTtl())
      .encrypt(this.getJweSecretKey());
  }

  private async decryptSessionToken(
    sessionToken: string,
  ): Promise<AuthUserPayload> {
    try {
      const decrypted = await jwtDecrypt(sessionToken, this.getJweSecretKey());
      return decrypted.payload as unknown as AuthUserPayload;
    } catch {
      throw new UnauthorizedException(
        AUTH_MESSAGES_PT_BR.invalidOrExpiredSessionToken,
      );
    }
  }

  private getJweSecretKey(): Uint8Array {
    const secret = this.configService.get<string>(
      'AUTH_JWE_SECRET',
      'local-dev-jwe-secret',
    );
    const hashed = createHash('sha256').update(secret).digest();
    return new Uint8Array(hashed);
  }

  private getSessionTtl(): string {
    return this.configService.get<string>('AUTH_JWE_EXPIRATION', '7d');
  }

  private removeSensitiveFields(user: User): Omit<User, 'passwordHash'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }

  private buildUsername(email: string): string {
    return email.split('@')[0].slice(0, 40);
  }

  private resolveRole(
    requestedRole: UserRole | undefined,
    email: string | undefined,
  ): UserRole {
    if (requestedRole !== UserRole.ADMIN) {
      return UserRole.USER;
    }

    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    if (adminEmail && email === adminEmail) {
      return UserRole.ADMIN;
    }

    return UserRole.USER;
  }

  private ensureStrongPassword(password: string): void {
    if (!STRONG_PASSWORD_REGEX.test(password)) {
      throw new BadRequestException(STRONG_PASSWORD_MESSAGE);
    }
  }

  private ensureLocalCredentials(input: RegisterInput | LoginInput): {
    email: string;
    password: string;
  } {
    if (!input.email || !input.password) {
      throw new BadRequestException(
        AUTH_MESSAGES_PT_BR.emailAndPasswordRequired,
      );
    }
    return {
      email: input.email,
      password: input.password,
    };
  }

  private ensureFirebaseIdToken(firebaseIdToken?: string): string {
    if (!firebaseIdToken) {
      throw new BadRequestException(
        AUTH_MESSAGES_PT_BR.firebaseIdTokenRequired(),
      );
    }
    return firebaseIdToken;
  }

  private throwInvalidCredentials(): never {
    throw new UnauthorizedException(AUTH_MESSAGES_PT_BR.invalidCredentials);
  }

  private async resolveRegistrationContext(
    input: RegisterInput,
  ): Promise<RegistrationContext> {
    if (!input.referralCode) {
      return {
        referralCode: generateReferralCode(),
        referredByUserId: null,
      };
    }

    const referrer = await this.userRepository.findByReferralCode(
      input.referralCode,
    );
    if (!referrer) {
      throw new BadRequestException(
        CREDIT_MESSAGES_PT_BR.invalidRegistrationReferralCode,
      );
    }

    if (input.email && referrer.email === input.email) {
      throw new BadRequestException(
        CREDIT_MESSAGES_PT_BR.referralCodeSelfReference,
      );
    }

    return {
      referralCode: generateReferralCode(),
      referredByUserId: referrer.id,
    };
  }
}
