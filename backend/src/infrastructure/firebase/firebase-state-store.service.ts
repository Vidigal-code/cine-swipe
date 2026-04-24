import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Database } from 'firebase-admin/database';
import { DocumentReference, Firestore } from 'firebase-admin/firestore';
import { FirebaseAdminService } from './firebase-admin.service';
import {
  createEmptyFirebaseState,
  FirebaseDataState,
} from './firebase-state.types';
import { resolveDatabaseProvider } from '../../shared/config/platform.config';

const FIRESTORE_STATE_COLLECTION = 'cineswipe_state';
const FIRESTORE_STATE_DOC_ID = 'app';
const REALTIME_STATE_PATH = 'cineswipe_state';

@Injectable()
export class FirebaseStateStoreService {
  constructor(
    private readonly firebaseAdminService: FirebaseAdminService,
    private readonly configService: ConfigService,
  ) {}

  readState(): Promise<FirebaseDataState> {
    const provider = resolveDatabaseProvider(this.configService);
    if (provider === 'realtime') {
      return this.readRealtimeState();
    }
    return this.readFirestoreState();
  }

  async runStateTransaction<T>(
    mutator: (state: FirebaseDataState) => T,
  ): Promise<T> {
    const provider = resolveDatabaseProvider(this.configService);
    if (provider === 'realtime') {
      return this.runRealtimeTransaction(mutator);
    }
    return this.runFirestoreTransaction(mutator);
  }

  private async readFirestoreState(): Promise<FirebaseDataState> {
    const stateRef = this.getFirestoreStateRef();
    const snapshot = await stateRef.get();
    return this.normalizeState(snapshot.data());
  }

  private async readRealtimeState(): Promise<FirebaseDataState> {
    const snapshot = await this.getRealtimeStateRef().get();
    return this.normalizeState(snapshot.val());
  }

  private async runFirestoreTransaction<T>(
    mutator: (state: FirebaseDataState) => T,
  ): Promise<T> {
    const firestore = this.firebaseAdminService.getFirestore();
    const stateRef = this.getFirestoreStateRef();
    return firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(stateRef);
      const nextState = this.cloneState(this.normalizeState(snapshot.data()));
      const result = mutator(nextState);
      transaction.set(stateRef, nextState, { merge: false });
      return result;
    });
  }

  private async runRealtimeTransaction<T>(
    mutator: (state: FirebaseDataState) => T,
  ): Promise<T> {
    let mutationResult: T | null = null;
    const stateRef = this.getRealtimeStateRef();
    await stateRef.transaction((currentValue: unknown) => {
      const nextState = this.cloneState(this.normalizeState(currentValue));
      mutationResult = mutator(nextState);
      return nextState;
    });
    if (mutationResult === null) {
      throw new Error('Realtime transaction did not complete');
    }
    return mutationResult;
  }

  private getFirestoreStateRef(): DocumentReference {
    const firestore: Firestore = this.firebaseAdminService.getFirestore();
    return firestore
      .collection(FIRESTORE_STATE_COLLECTION)
      .doc(FIRESTORE_STATE_DOC_ID);
  }

  private getRealtimeStateRef() {
    const database: Database = this.firebaseAdminService.getRealtimeDatabase();
    return database.ref(REALTIME_STATE_PATH);
  }

  private normalizeState(raw: unknown): FirebaseDataState {
    const base = createEmptyFirebaseState();
    if (!raw || typeof raw !== 'object') {
      return base;
    }
    const parsed = raw as Partial<FirebaseDataState>;
    return {
      ...base,
      ...parsed,
      users: parsed.users ?? base.users,
      movies: parsed.movies ?? base.movies,
      purchases: parsed.purchases ?? base.purchases,
      paymentOutbox: parsed.paymentOutbox ?? base.paymentOutbox,
      paymentAudits: parsed.paymentAudits ?? base.paymentAudits,
      creditPlans: parsed.creditPlans ?? base.creditPlans,
      creditSystemConfig: parsed.creditSystemConfig ?? base.creditSystemConfig,
      creditPurchases: parsed.creditPurchases ?? base.creditPurchases,
      creditPurchaseOutbox:
        parsed.creditPurchaseOutbox ?? base.creditPurchaseOutbox,
      creditTransactions: parsed.creditTransactions ?? base.creditTransactions,
      referralRewardLogs: parsed.referralRewardLogs ?? base.referralRewardLogs,
      processedWebhookEvents:
        parsed.processedWebhookEvents ?? base.processedWebhookEvents,
    };
  }

  private cloneState(state: FirebaseDataState): FirebaseDataState {
    return JSON.parse(JSON.stringify(state)) as FirebaseDataState;
  }
}
