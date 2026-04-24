import { ConfigService } from '@nestjs/config';
import { DecodedIdToken } from 'firebase-admin/auth';
export declare class FirebaseAuthService {
    private readonly configService;
    private readonly app;
    constructor(configService: ConfigService);
    isEnabled(): boolean;
    verifyIdToken(idToken: string): Promise<DecodedIdToken>;
    private createApp;
    private parseServiceAccount;
    private getOrCreateApp;
}
