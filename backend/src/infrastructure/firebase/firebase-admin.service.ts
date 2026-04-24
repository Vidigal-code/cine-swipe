import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { DecodedIdToken, getAuth } from 'firebase-admin/auth';
import { Firestore, getFirestore } from 'firebase-admin/firestore';
import { Database, getDatabase } from 'firebase-admin/database';
import { getStorage } from 'firebase-admin/storage';

type FirebaseBucket = ReturnType<ReturnType<typeof getStorage>['bucket']>;

interface FirebaseServiceAccount {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

@Injectable()
export class FirebaseAdminService {
  private readonly app: App | null;
  private firestoreClient: Firestore | null = null;
  private realtimeClient: Database | null = null;
  private bucketClient: FirebaseBucket | null = null;

  constructor(private readonly configService: ConfigService) {
    this.app = this.createApp();
  }

  isConfigured(): boolean {
    return this.app !== null;
  }

  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    if (!this.app) {
      throw new Error('Firebase app is not configured');
    }
    return getAuth(this.app).verifyIdToken(idToken, true);
  }

  getFirestore(): Firestore {
    if (!this.app) {
      throw new Error('Firebase app is not configured');
    }
    if (!this.firestoreClient) {
      this.firestoreClient = getFirestore(this.app);
    }
    return this.firestoreClient;
  }

  getRealtimeDatabase(): Database {
    if (!this.app) {
      throw new Error('Firebase app is not configured');
    }
    if (!this.realtimeClient) {
      this.realtimeClient = getDatabase(this.app);
    }
    return this.realtimeClient;
  }

  getStorageBucket(): FirebaseBucket {
    if (!this.app) {
      throw new Error('Firebase app is not configured');
    }
    if (!this.bucketClient) {
      const configuredBucket = this.configService.get<string>(
        'FIREBASE_STORAGE_BUCKET',
      );
      if (configuredBucket && configuredBucket.trim().length > 0) {
        this.bucketClient = getStorage(this.app).bucket(
          configuredBucket.trim(),
        );
      } else {
        this.bucketClient = getStorage(this.app).bucket();
      }
    }
    return this.bucketClient;
  }

  private createApp(): App | null {
    const credentials = this.readServiceAccount();
    if (!credentials) {
      return null;
    }

    const databaseURL = this.configService.get<string>('FIREBASE_DATABASE_URL');
    const storageBucket = this.configService.get<string>(
      'FIREBASE_STORAGE_BUCKET',
    );

    return this.getOrCreateApp(
      cert({
        projectId: credentials.projectId,
        clientEmail: credentials.clientEmail,
        privateKey: credentials.privateKey,
      }),
      databaseURL,
      storageBucket,
    );
  }

  private readServiceAccount(): FirebaseServiceAccount | null {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService
      .get<string>('FIREBASE_PRIVATE_KEY')
      ?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      return { projectId, clientEmail, privateKey };
    }

    const rawServiceAccount =
      this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON') ?? '';
    if (!rawServiceAccount) {
      return null;
    }
    return this.parseServiceAccount(rawServiceAccount);
  }

  private parseServiceAccount(rawValue: string): FirebaseServiceAccount {
    try {
      return JSON.parse(rawValue) as FirebaseServiceAccount;
    } catch {
      const decoded = Buffer.from(rawValue, 'base64').toString('utf8');
      return JSON.parse(decoded) as FirebaseServiceAccount;
    }
  }

  private getOrCreateApp(
    credentials: ReturnType<typeof cert>,
    databaseURL?: string,
    storageBucket?: string,
  ): App {
    if (getApps().length > 0) {
      return getApps()[0];
    }
    return initializeApp({
      credential: credentials,
      databaseURL,
      storageBucket,
    });
  }
}
