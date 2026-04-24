export interface FirebaseUserRecord {
  id: string;
  username: string;
  email: string;
  passwordHash: string | null;
  firebaseUid: string | null;
  role: string;
  creditsBalance: number;
  avatarUrl: string | null;
  referralCode: string;
  referredByUserId: string | null;
  firstApprovedCreditPurchaseDone: boolean;
  referralSignupBonusGranted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FirebaseMovieRecord {
  id: string;
  title: string;
  synopsis: string;
  genre: string;
  price: number;
  posterUrl: string | null;
  trailerUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FirebasePurchaseRecord {
  id: string;
  userId: string;
  movieId: string;
  amount: number;
  status: string;
  provider: string;
  correlationId: string;
  stripePaymentIntentId: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FirebasePaymentOutboxRecord {
  id: string;
  purchaseId: string;
  eventType: string;
  payload: Record<string, unknown>;
  status: string;
  attempts: number;
  nextAttemptAt: string | null;
  lastError: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FirebasePaymentAuditRecord {
  id: string;
  purchaseId: string;
  userId: string;
  userName: string;
  userEmail: string;
  movieId: string;
  movieTitle: string;
  amount: number;
  provider: string;
  status: string;
  correlationId: string;
  stripePaymentIntentId: string | null;
  eventType: string;
  source: string;
  message: string | null;
  createdAt: string;
}

export interface FirebaseCreditPlanRecord {
  id: string;
  name: string;
  creditsAmount: number;
  priceBrl: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FirebaseCreditSystemConfigRecord {
  id: number;
  registrationBonusCredits: number;
  referralEnabled: boolean;
  refereeRegistrationBonusCredits: number;
  referrerFirstPurchaseBonusCredits: number;
  createdAt: string;
  updatedAt: string;
}

export interface FirebaseCreditPurchaseRecord {
  id: string;
  userId: string;
  creditPlanId: string;
  creditsAmount: number;
  amountBrl: number;
  status: string;
  provider: string;
  correlationId: string;
  stripePaymentIntentId: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FirebaseCreditPurchaseOutboxRecord {
  id: string;
  creditPurchaseId: string;
  eventType: string;
  payload: Record<string, unknown>;
  status: string;
  attempts: number;
  nextAttemptAt: string | null;
  lastError: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FirebaseCreditTransactionRecord {
  id: string;
  userId: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string | null;
  correlationId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface FirebaseReferralRewardLogRecord {
  id: string;
  referrerUserId: string;
  refereeUserId: string;
  rewardType: string;
  creditsGranted: number;
  correlationId: string | null;
  createdAt: string;
}

export interface FirebaseWebhookEventRecord {
  id: string;
  createdAt: string;
}

export interface FirebaseDataState {
  users: Record<string, FirebaseUserRecord>;
  movies: Record<string, FirebaseMovieRecord>;
  purchases: Record<string, FirebasePurchaseRecord>;
  paymentOutbox: Record<string, FirebasePaymentOutboxRecord>;
  paymentAudits: Record<string, FirebasePaymentAuditRecord>;
  creditPlans: Record<string, FirebaseCreditPlanRecord>;
  creditSystemConfig: FirebaseCreditSystemConfigRecord | null;
  creditPurchases: Record<string, FirebaseCreditPurchaseRecord>;
  creditPurchaseOutbox: Record<string, FirebaseCreditPurchaseOutboxRecord>;
  creditTransactions: Record<string, FirebaseCreditTransactionRecord>;
  referralRewardLogs: Record<string, FirebaseReferralRewardLogRecord>;
  processedWebhookEvents: Record<string, FirebaseWebhookEventRecord>;
}

export function createEmptyFirebaseState(): FirebaseDataState {
  return {
    users: {},
    movies: {},
    purchases: {},
    paymentOutbox: {},
    paymentAudits: {},
    creditPlans: {},
    creditSystemConfig: null,
    creditPurchases: {},
    creditPurchaseOutbox: {},
    creditTransactions: {},
    referralRewardLogs: {},
    processedWebhookEvents: {},
  };
}
