import request from 'supertest';
import type { NestExpressApplication } from '@nestjs/platform-express';
import {
  ACCESS_TOKEN_COOKIE,
  CSRF_HEADER_NAME,
  CSRF_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '../../src/shared/auth/auth-cookie.config';
import { createE2eApp, type E2eAppContext } from './setup/create-e2e-app';
import {
  extractCookies,
  mergeCookieJar,
  toCookieHeader,
} from './setup/http-helpers';

describe('Auth E2E', () => {
  let context: E2eAppContext;
  let app: NestExpressApplication;

  beforeAll(async () => {
    context = await createE2eApp();
    app = context.app;
  });

  afterAll(async () => {
    await context.close();
  });

  beforeEach(() => {
    context.resetState();
  });

  it('registers user and returns auth cookies', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'user-auth-e2e@mail.local',
        password: 'Password@123',
      });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe('user-auth-e2e@mail.local');

    const cookies = extractCookies(response);
    expect(cookies[ACCESS_TOKEN_COOKIE]).toBeDefined();
    expect(cookies[REFRESH_TOKEN_COOKIE]).toBeDefined();
    expect(cookies[CSRF_TOKEN_COOKIE]).toBeDefined();
  });

  it('authenticates with login and returns profile', async () => {
    await request(app.getHttpServer()).post('/auth/register').send({
      email: 'login-auth-e2e@mail.local',
      password: 'Password@123',
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'login-auth-e2e@mail.local',
        password: 'Password@123',
      });
    const cookies = extractCookies(loginResponse);

    const profileResponse = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', toCookieHeader(cookies));

    expect(loginResponse.status).toBe(201);
    expect(profileResponse.status).toBe(200);
    expect(profileResponse.body.user.email).toBe('login-auth-e2e@mail.local');
  });

  it('rejects refresh without valid csrf header and succeeds when csrf is valid', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'refresh-auth-e2e@mail.local',
        password: 'Password@123',
      });
    const cookieJar = mergeCookieJar({}, registerResponse);

    const missingCsrfResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', toCookieHeader(cookieJar))
      .send({});
    expect(missingCsrfResponse.status).toBe(401);

    const validRefreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', toCookieHeader(cookieJar))
      .set(CSRF_HEADER_NAME, cookieJar[CSRF_TOKEN_COOKIE])
      .send({});

    expect(validRefreshResponse.status).toBe(201);
    const refreshedCookies = extractCookies(validRefreshResponse);
    expect(refreshedCookies[ACCESS_TOKEN_COOKIE]).toBeDefined();
    expect(refreshedCookies[REFRESH_TOKEN_COOKIE]).toBeDefined();
    expect(refreshedCookies[CSRF_TOKEN_COOKIE]).toBeDefined();
  });

  it('logs out and invalidates cookie-based profile access', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'logout-auth-e2e@mail.local',
        password: 'Password@123',
      });
    const initialCookies = mergeCookieJar({}, registerResponse);

    const logoutResponse = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', toCookieHeader(initialCookies))
      .set(CSRF_HEADER_NAME, initialCookies[CSRF_TOKEN_COOKIE])
      .send({});
    expect(logoutResponse.status).toBe(201);

    const cookieJarAfterLogout = mergeCookieJar(initialCookies, logoutResponse);
    const meAfterLogout = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', toCookieHeader(cookieJarAfterLogout));

    expect(meAfterLogout.status).toBe(401);
  });
});
