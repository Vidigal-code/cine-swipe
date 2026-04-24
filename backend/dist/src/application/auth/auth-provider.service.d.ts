import { ConfigService } from '@nestjs/config';
import type { IUserRepository } from '../../domain/user/interfaces/user.repository';
import { User, UserRole } from '../../domain/user/entities/user.entity';
import { FirebaseAuthService } from '../../infrastructure/auth/firebase-auth.service';
interface ResolveFirebaseUserOptions {
    requestedRole?: UserRole;
    referralCode?: string;
    referredByUserId?: string | null;
}
export declare class AuthProviderService {
    private readonly userRepository;
    private readonly configService;
    private readonly firebaseAuthService;
    constructor(userRepository: IUserRepository, configService: ConfigService, firebaseAuthService: FirebaseAuthService);
    getAuthProvider(): 'local' | 'firebase';
    resolveOrCreateFirebaseUser(firebaseIdToken: string, options?: ResolveFirebaseUserOptions): Promise<{
        user: User;
        isNewlyCreated: boolean;
    }>;
    private buildUsername;
}
export {};
