import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { IUserRepository } from '../../domain/user/interfaces/user.repository';
import { User, UserRole } from '../../domain/user/entities/user.entity';
import { AuthProviderService } from './auth-provider.service';
import { CreditService } from '../credit/credit.service';
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
export declare class AuthService {
    private readonly userRepository;
    private readonly jwtService;
    private readonly configService;
    private readonly authProviderService;
    private readonly creditService;
    constructor(userRepository: IUserRepository, jwtService: JwtService, configService: ConfigService, authProviderService: AuthProviderService, creditService: CreditService);
    register(input: RegisterInput): Promise<AuthResult>;
    login(input: LoginInput): Promise<AuthResult>;
    refresh(sessionToken: string): Promise<AuthResult>;
    getProfile(userId: string): Promise<Omit<User, 'passwordHash'>>;
    updateProfile(userId: string, input: UpdateProfileInput): Promise<Omit<User, 'passwordHash'>>;
    updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    updateAvatar(userId: string, avatarUrl: string): Promise<Omit<User, 'passwordHash'>>;
    private registerWithLocalCredentials;
    private registerWithFirebase;
    private loginWithLocalCredentials;
    private loginWithFirebase;
    private buildAuthResult;
    private buildUserPayload;
    private createCsrfToken;
    private encryptSessionToken;
    private decryptSessionToken;
    private getJweSecretKey;
    private getSessionTtl;
    private removeSensitiveFields;
    private buildUsername;
    private resolveRole;
    private ensureStrongPassword;
    private ensureLocalCredentials;
    private ensureFirebaseIdToken;
    private throwInvalidCredentials;
    private resolveRegistrationContext;
}
export {};
