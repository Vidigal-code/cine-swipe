import type { Response } from 'supertest';

export function extractCookies(response: Response): Record<string, string> {
  const setCookieHeader = response.headers['set-cookie'];
  const cookieLines = normalizeSetCookie(setCookieHeader);

  return cookieLines.reduce<Record<string, string>>((accumulator, line) => {
    const [cookiePair] = line.split(';');
    const separatorIndex = cookiePair.indexOf('=');
    if (separatorIndex <= 0) {
      return accumulator;
    }
    const name = cookiePair.slice(0, separatorIndex).trim();
    const value = cookiePair.slice(separatorIndex + 1).trim();
    accumulator[name] = value;
    return accumulator;
  }, {});
}

export function mergeCookieJar(
  jar: Record<string, string>,
  response: Response,
): Record<string, string> {
  return {
    ...jar,
    ...extractCookies(response),
  };
}

export function toCookieHeader(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
}

function normalizeSetCookie(
  setCookieHeader: string[] | string | undefined,
): string[] {
  if (!setCookieHeader) {
    return [];
  }
  if (Array.isArray(setCookieHeader)) {
    return setCookieHeader;
  }
  return [setCookieHeader];
}
