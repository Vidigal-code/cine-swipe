export declare const AUTH_MESSAGES_PT_BR: {
    readonly sessionTokenRequired: "Token de sessao obrigatorio.";
    readonly sessionNoLongerValid: "A sessao nao e mais valida.";
    readonly userSessionNoLongerValid: "A sessao do usuario nao e mais valida.";
    readonly emailAndPasswordRequired: "Email e senha sao obrigatorios.";
    readonly emailAlreadyInUse: "Email ja esta em uso.";
    readonly invalidCredentials: "Credenciais invalidas.";
    readonly invalidOrExpiredSessionToken: "Token de sessao invalido ou expirado.";
    readonly strongPasswordPolicy: "A senha deve ter 8 a 64 caracteres com letra maiuscula, letra minuscula, numero e simbolo.";
    readonly userSessionInvalid: "Sessao do usuario invalida.";
    readonly refreshTokenRequired: "Token de atualizacao obrigatorio.";
    readonly csrfValidationFailed: "Falha na validacao CSRF.";
    readonly authenticationRequired: "Autenticacao obrigatoria.";
    readonly invalidOrExpiredToken: "Token invalido ou expirado.";
    readonly insufficientPermissions: "Permissoes insuficientes.";
    readonly currentPasswordInvalid: "Senha atual invalida.";
    readonly passwordUpdateNotAvailable: "Atualizacao de senha indisponivel para este tipo de conta.";
    readonly firebaseIdTokenRequired: (provider?: string) => string;
};
