process.env.TZ = 'UTC';

jest.mock('jose', () => {
  class EncryptJWT {
    private readonly payload: Record<string, unknown>;

    constructor(payload: Record<string, unknown>) {
      this.payload = payload;
    }

    setProtectedHeader() {
      return this;
    }

    setIssuedAt() {
      return this;
    }

    setExpirationTime() {
      return this;
    }

    async encrypt() {
      const sub = this.payload.sub as string | undefined;
      return `session-${sub ?? 'anonymous'}`;
    }
  }

  return {
    EncryptJWT,
    jwtDecrypt: jest.fn(async (sessionToken: string) => {
      if (!sessionToken.startsWith('session-')) {
        throw new Error('Invalid token');
      }

      const subject = sessionToken.replace('session-', '');
      return {
        payload: {
          sub: subject,
          email: `${subject}@mail.local`,
          role: 'USER',
        },
      };
    }),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});
