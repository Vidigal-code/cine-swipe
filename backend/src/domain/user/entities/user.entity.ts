export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export class User {
  id!: string;
  username!: string;
  email!: string;
  passwordHash!: string | null;
  firebaseUid!: string | null;
  role!: UserRole;
  creditsBalance!: number;
  avatarUrl!: string | null;
  referralCode!: string;
  referredByUserId!: string | null;
  firstApprovedCreditPurchaseDone!: boolean;
  referralSignupBonusGranted!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
