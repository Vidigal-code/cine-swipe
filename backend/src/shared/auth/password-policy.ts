import { AUTH_MESSAGES_PT_BR } from './auth-messages.pt-br';

export const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;

export const STRONG_PASSWORD_MESSAGE = AUTH_MESSAGES_PT_BR.strongPasswordPolicy;
