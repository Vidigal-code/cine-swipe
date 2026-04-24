export enum ReferralRewardType {
  REFEREE_REGISTRATION = 'REFEREE_REGISTRATION',
  REFERRER_FIRST_PURCHASE = 'REFERRER_FIRST_PURCHASE',
}

export class ReferralRewardLog {
  id!: string;
  referrerUserId!: string;
  refereeUserId!: string;
  rewardType!: ReferralRewardType;
  creditsGranted!: number;
  correlationId!: string | null;
  createdAt!: Date;
}
