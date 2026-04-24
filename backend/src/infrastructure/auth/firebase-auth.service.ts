import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { DecodedIdToken, getAuth } from 'firebase-admin/auth';

@Injectable()
export class FirebaseAuthService {
  private readonly app: App | null;

  constructor(private readonly configService: ConfigService) {
    this.app = this.createApp();
  }

  isEnabled(): boolean {
    return this.app !== null;
  }

  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    if (!this.app) {
      throw new UnauthorizedException('Firebase auth is not configured');
    }

    return getAuth(this.app).verifyIdToken(idToken, true);
  }

  private createApp(): App | null {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService
      .get<string>('FIREBASE_PRIVATE_KEY')
      ?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      return this.getOrCreateApp(
        cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      );
    }

    const rawServiceAccount =
      this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON') ?? '';
    if (!rawServiceAccount) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const parsedJson = this.parseServiceAccount(rawServiceAccount);
    return this.getOrCreateApp(cert(parsedJson));
  }

  private parseServiceAccount(rawValue: string) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return JSON.parse(rawValue);
    } catch {
      const decoded = Buffer.from(rawValue, 'base64').toString('utf8');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return JSON.parse(decoded);
    }
  }

  private getOrCreateApp(credentials: ReturnType<typeof cert>): App {
    if (getApps().length > 0) {
      return getApps()[0];
    }

    return initializeApp({ credential: credentials });
  }
}
