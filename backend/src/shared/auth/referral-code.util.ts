import { randomBytes } from 'crypto';

const REFERRAL_CODE_PREFIX = 'ref_';
const REFERRAL_CODE_RANDOM_BYTES = 6;

export function generateReferralCode(): string {
  return `${REFERRAL_CODE_PREFIX}${randomBytes(REFERRAL_CODE_RANDOM_BYTES).toString('hex')}`;
}
