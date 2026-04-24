"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
process.env.TZ = 'UTC';
jest.mock('jose', () => {
    class EncryptJWT {
        payload;
        constructor(payload) {
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
            const sub = this.payload.sub;
            return `session-${sub ?? 'anonymous'}`;
        }
    }
    return {
        EncryptJWT,
        jwtDecrypt: jest.fn(async (sessionToken) => {
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
//# sourceMappingURL=jest.setup.js.map