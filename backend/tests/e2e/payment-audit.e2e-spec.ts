import request from 'supertest';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import {
  CSRF_HEADER_NAME,
  CSRF_TOKEN_COOKIE,
} from '../../src/shared/auth/auth-cookie.config';
import { createE2eApp, type E2eAppContext } from './setup/create-e2e-app';
import { mergeCookieJar, toCookieHeader } from './setup/http-helpers';

describe('Payment audit admin E2E', () => {
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

  it('returns paginated audits for admin', async () => {
    const adminCookies = await registerAdmin(app);
    const response = await request(app.getHttpServer())
      .get('/payments/admin/audits?page=1&limit=10')
      .set('Cookie', toCookieHeader(adminCookies));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.meta).toMatchObject({
      page: 1,
      limit: 10,
    });
  });

  it('records audit row after checkout (purchaseId present)', async () => {
    const adminCookies = await registerAdmin(app);
    const userCookies = await registerUser(app, 'audit-buyer-e2e@mail.local');
    const movie = await createMovie(app, adminCookies);

    const checkoutResponse = await request(app.getHttpServer())
      .post('/payments/checkout')
      .set('Cookie', toCookieHeader(userCookies))
      .set(CSRF_HEADER_NAME, userCookies[CSRF_TOKEN_COOKIE])
      .send({ movieId: movie.id });

    expect(checkoutResponse.status).toBe(201);
    const purchaseId = checkoutResponse.body.id as string;

    const auditsResponse = await request(app.getHttpServer())
      .get('/payments/admin/audits?page=1&limit=20')
      .set('Cookie', toCookieHeader(adminCookies));

    expect(auditsResponse.status).toBe(200);
    const rows = auditsResponse.body.data as Array<{ purchaseId: string }>;
    expect(rows.some((row) => row.purchaseId === purchaseId)).toBe(true);
  });

  it('returns 403 for non-admin user', async () => {
    const userResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'audit-user-e2e@mail.local',
        password: 'Password@123',
      });
    const userCookies = mergeCookieJar({}, userResponse);

    const response = await request(app.getHttpServer())
      .get('/payments/admin/audits?page=1&limit=10')
      .set('Cookie', toCookieHeader(userCookies))
      .set(CSRF_HEADER_NAME, userCookies[CSRF_TOKEN_COOKIE]);

    expect(response.status).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    const response = await request(app.getHttpServer()).get(
      '/payments/admin/audits?page=1&limit=10',
    );
    expect(response.status).toBe(401);
  });
});

async function registerAdmin(
  app: NestExpressApplication,
): Promise<Record<string, string>> {
  const response = await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      username: 'vidigal-admin',
      email: 'admin@system.local',
      password: 'Admin@12345',
      role: 'ADMIN',
    });
  return mergeCookieJar({}, response);
}

async function registerUser(
  app: NestExpressApplication,
  email: string,
): Promise<Record<string, string>> {
  const response = await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      email,
      password: 'Password@123',
    });
  return mergeCookieJar({}, response);
}

async function createMovie(
  app: NestExpressApplication,
  adminCookies: Record<string, string>,
): Promise<{ id: string }> {
  const response = await request(app.getHttpServer())
    .post('/movies')
    .set('Cookie', toCookieHeader(adminCookies))
    .set(CSRF_HEADER_NAME, adminCookies[CSRF_TOKEN_COOKIE])
    .send({
      title: `Audit Movie ${randomUUID()}`,
      synopsis: 'Movie for audit e2e',
      genre: 'Action',
      price: 15.5,
      posterUrl: 'https://cdn.example.com/poster.png',
      trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    });

  expect(response.status).toBe(201);
  return response.body as { id: string };
}
