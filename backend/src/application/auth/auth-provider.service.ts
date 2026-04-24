import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { USER_REPOSITORY } from '../../domain/user/interfaces/user.repository';
import type { IUserRepository } from '../../domain/user/interfaces/user.repository';
import { User, UserRole } from '../../domain/user/entities/user.entity';
import { FirebaseAuthService } from '../../infrastructure/auth/firebase-auth.service';
import { generateReferralCode } from '../../shared/auth/referral-code.util';

interface ResolveFirebaseUserOptions {
  requestedRole?: UserRole;
  referralCode?: string;
  referredByUserId?: string | null;
}

@Injectable()
export class AuthProviderService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly configService: ConfigService,
    private readonly firebaseAuthService: FirebaseAuthService,
  ) {}

  getAuthProvider(): 'local' | 'firebase' {
    const provider = this.configService.get<string>('AUTH_PROVIDER', 'local');
    return provider === 'firebase' ? 'firebase' : 'local';
  }

  async resolveOrCreateFirebaseUser(
    firebaseIdToken: string,
    options?: ResolveFirebaseUserOptions,
  ): Promise<{ user: User; isNewlyCreated: boolean }> {
    const requestedRole = options?.requestedRole ?? UserRole.USER;
    const decodedToken =
      await this.firebaseAuthService.verifyIdToken(firebaseIdToken);
    const email = decodedToken.email;
    const firebaseUid = decodedToken.uid;

    if (!email) {
      throw new BadRequestException(
        'Firebase token does not contain a valid email',
      );
    }

    const existingByFirebase =
      await this.userRepository.findByFirebaseUid(firebaseUid);
    if (existingByFirebase) {
      return {
        user: existingByFirebase,
        isNewlyCreated: false,
      };
    }

    const existingByEmail = await this.userRepository.findByEmail(email);
    if (existingByEmail) {
      const updatedUser = await this.userRepository.update(existingByEmail.id, {
        firebaseUid,
      });
      return {
        user: updatedUser,
        isNewlyCreated: false,
      };
    }

    const user = await this.userRepository.create({
      username: this.buildUsername(email),
      email,
      firebaseUid,
      role: requestedRole,
      passwordHash: null,
      referralCode: options?.referralCode ?? generateReferralCode(),
      referredByUserId: options?.referredByUserId ?? null,
    });

    return {
      user,
      isNewlyCreated: true,
    };
  }

  private buildUsername(email: string): string {
    return email.split('@')[0].slice(0, 40);
  }
}
