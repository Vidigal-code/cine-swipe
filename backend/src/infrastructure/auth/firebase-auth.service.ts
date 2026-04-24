import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DecodedIdToken } from 'firebase-admin/auth';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';

@Injectable()
export class FirebaseAuthService {
  constructor(private readonly firebaseAdminService: FirebaseAdminService) {}

  isEnabled(): boolean {
    return this.firebaseAdminService.isConfigured();
  }

  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    if (!this.firebaseAdminService.isConfigured()) {
      throw new UnauthorizedException('Firebase auth is not configured');
    }
    try {
      return await this.firebaseAdminService.verifyIdToken(idToken);
    } catch {
      throw new UnauthorizedException('Invalid firebase id token');
    }
  }
}
