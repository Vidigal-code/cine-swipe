import request from 'supertest';
import type { NestExpressApplication } from '@nestjs/platform-express';
import {
  CSRF_HEADER_NAME,
  CSRF_TOKEN_COOKIE,
} from '../../src/shared/auth/auth-cookie.config';
import { createE2eApp, type E2eAppContext } from './setup/create-e2e-app';
import { mergeCookieJar, toCookieHeader } from './setup/http-helpers';

describe('Admin Users E2E', () => {
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

  it('blocks common users from admin users endpoints', async () => {
    const commonCookies = await registerAndGetCookies(
      app,
      'common-admin-users@mail.local',
      'Password@123',
    );

    const response = await request(app.getHttpServer())
      .get('/admin/users?page=1&limit=10')
      .set('Cookie', toCookieHeader(commonCookies));

    expect(response.status).toBe(403);
  });

  it('supports admin CRUD flow with paginated listing', async () => {
    const adminCookies = await registerAndGetCookies(
      app,
      'admin@system.local',
      'Admin@12345',
      'ADMIN',
    );

    const createResponse = await request(app.getHttpServer())
      .post('/admin/users')
      .set('Cookie', toCookieHeader(adminCookies))
      .set(CSRF_HEADER_NAME, adminCookies[CSRF_TOKEN_COOKIE])
      .send({
        username: 'managed-user',
        email: 'managed-user@mail.local',
        password: 'Password@123',
        role: 'USER',
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.email).toBe('managed-user@mail.local');
    expect(createResponse.body.role).toBe('USER');

    const userId = createResponse.body.id as string;

    const listResponse = await request(app.getHttpServer())
      .get('/admin/users?page=1&limit=5')
      .set('Cookie', toCookieHeader(adminCookies));

    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listResponse.body.data)).toBe(true);
    expect(listResponse.body.meta.page).toBe(1);
    expect(
      listResponse.body.data.some((item: { id: string }) => item.id === userId),
    ).toBe(true);

    const updateResponse = await request(app.getHttpServer())
      .patch(`/admin/users/${userId}`)
      .set('Cookie', toCookieHeader(adminCookies))
      .set(CSRF_HEADER_NAME, adminCookies[CSRF_TOKEN_COOKIE])
      .send({
        username: 'managed-user-updated',
        email: 'managed-user-updated@mail.local',
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.username).toBe('managed-user-updated');
    expect(updateResponse.body.email).toBe('managed-user-updated@mail.local');

    const roleResponse = await request(app.getHttpServer())
      .patch(`/admin/users/${userId}/role`)
      .set('Cookie', toCookieHeader(adminCookies))
      .set(CSRF_HEADER_NAME, adminCookies[CSRF_TOKEN_COOKIE])
      .send({ role: 'ADMIN' });

    expect(roleResponse.status).toBe(200);
    expect(roleResponse.body.role).toBe('ADMIN');

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/admin/users/${userId}`)
      .set('Cookie', toCookieHeader(adminCookies))
      .set(CSRF_HEADER_NAME, adminCookies[CSRF_TOKEN_COOKIE]);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);
  });
});

async function registerAndGetCookies(
  app: NestExpressApplication,
  email: string,
  password: string,
  role?: 'ADMIN' | 'USER',
): Promise<Record<string, string>> {
  const registerResponse = await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      email,
      password,
      ...(role ? { role } : {}),
    });

  return mergeCookieJar({}, registerResponse);
}
