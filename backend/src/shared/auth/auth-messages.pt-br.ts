const AUTH_PROVIDER_FIREBASE = 'AUTH_PROVIDER=firebase';

export const AUTH_MESSAGES_PT_BR = {
  sessionTokenRequired: 'Token de sessao obrigatorio.',
  sessionNoLongerValid: 'A sessao nao e mais valida.',
  userSessionNoLongerValid: 'A sessao do usuario nao e mais valida.',
  emailAndPasswordRequired: 'Email e senha sao obrigatorios.',
  emailAlreadyInUse: 'Email ja esta em uso.',
  invalidCredentials: 'Credenciais invalidas.',
  invalidOrExpiredSessionToken: 'Token de sessao invalido ou expirado.',
  strongPasswordPolicy:
    'A senha deve ter 8 a 64 caracteres com letra maiuscula, letra minuscula, numero e simbolo.',
  userSessionInvalid: 'Sessao do usuario invalida.',
  refreshTokenRequired: 'Token de atualizacao obrigatorio.',
  csrfValidationFailed: 'Falha na validacao CSRF.',
  authenticationRequired: 'Autenticacao obrigatoria.',
  invalidOrExpiredToken: 'Token invalido ou expirado.',
  insufficientPermissions: 'Permissoes insuficientes.',
  currentPasswordInvalid: 'Senha atual invalida.',
  passwordUpdateNotAvailable:
    'Atualizacao de senha indisponivel para este tipo de conta.',
  firebaseIdTokenRequired(provider = AUTH_PROVIDER_FIREBASE): string {
    return `firebaseIdToken obrigatorio quando ${provider}.`;
  },
} as const;
