import type { Response } from 'supertest';
export declare function extractCookies(response: Response): Record<string, string>;
export declare function mergeCookieJar(jar: Record<string, string>, response: Response): Record<string, string>;
export declare function toCookieHeader(cookies: Record<string, string>): string;
