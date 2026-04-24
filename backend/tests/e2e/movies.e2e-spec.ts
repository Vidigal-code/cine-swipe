import request from 'supertest';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import {
  CSRF_HEADER_NAME,
  CSRF_TOKEN_COOKIE,
} from '../../src/shared/auth/auth-cookie.config';
import { createE2eApp, type E2eAppContext } from './setup/create-e2e-app';
import { mergeCookieJar, toCookieHeader } from './setup/http-helpers';

describe('Movies + RBAC E2E', () => {
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

  it('returns public movie list and movie detail', async () => {
    const adminCookies = await registerAdmin(app);
    const createdMovie = await createMovie(app, adminCookies, {
      title: 'Public Catalog Movie',
    });

    const listResponse = await request(app.getHttpServer()).get(
      '/movies?page=1&limit=10',
    );
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data.length).toBe(1);
    expect(listResponse.body.data[0].id).toBe(createdMovie.id);

    const detailResponse = await request(app.getHttpServer()).get(
      `/movies/${createdMovie.id}`,
    );
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.id).toBe(createdMovie.id);
  });

  it('enforces admin role on movie write routes', async () => {
    const userCookies = await registerUser(app, 'user-rbac-e2e@mail.local');

    const userCreateResponse = await request(app.getHttpServer())
      .post('/movies')
      .set('Cookie', toCookieHeader(userCookies))
      .set(CSRF_HEADER_NAME, userCookies[CSRF_TOKEN_COOKIE])
      .send(buildMoviePayload({ title: 'Should Fail' }));
    expect(userCreateResponse.status).toBe(403);

    const anonymousCreateResponse = await request(app.getHttpServer())
      .post('/movies')
      .send(buildMoviePayload({ title: 'Anonymous Fail' }));
    expect(anonymousCreateResponse.status).toBe(401);
  });

  it('allows admin to create, update and delete movies', async () => {
    const adminCookies = await registerAdmin(app);
    const createdMovie = await createMovie(app, adminCookies, {
      title: 'CRUD Movie',
      genre: 'Sci-Fi',
    });

    const updateResponse = await request(app.getHttpServer())
      .put(`/movies/${createdMovie.id}`)
      .set('Cookie', toCookieHeader(adminCookies))
      .set(CSRF_HEADER_NAME, adminCookies[CSRF_TOKEN_COOKIE])
      .send({ genre: 'Drama' });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.genre).toBe('Drama');

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/movies/${createdMovie.id}`)
      .set('Cookie', toCookieHeader(adminCookies))
      .set(CSRF_HEADER_NAME, adminCookies[CSRF_TOKEN_COOKIE]);
    expect(deleteResponse.status).toBe(200);

    const detailAfterDelete = await request(app.getHttpServer()).get(
      `/movies/${createdMovie.id}`,
    );
    expect(detailAfterDelete.status).toBe(404);
  });

  it('validates upload type and size on movie upload endpoint', async () => {
    const adminCookies = await registerAdmin(app);

    const validUploadResponse = await request(app.getHttpServer())
      .post('/movies/upload')
      .set('Cookie', toCookieHeader(adminCookies))
      .set(CSRF_HEADER_NAME, adminCookies[CSRF_TOKEN_COOKIE])
      .attach('file', Buffer.from([0x89, 0x50, 0x4e, 0x47]), {
        filename: 'poster.png',
        contentType: 'image/png',
      });
    expect(validUploadResponse.status).toBe(201);
    expect(validUploadResponse.body.url).toContain('/uploads/');

    const invalidTypeResponse = await request(app.getHttpServer())
      .post('/movies/upload')
      .set('Cookie', toCookieHeader(adminCookies))
      .set(CSRF_HEADER_NAME, adminCookies[CSRF_TOKEN_COOKIE])
      .attach('file', Buffer.from('invalid'), {
        filename: 'poster.txt',
        contentType: 'text/plain',
      });
    expect(invalidTypeResponse.status).toBe(400);

    const tooLargeResponse = await request(app.getHttpServer())
      .post('/movies/upload')
      .set('Cookie', toCookieHeader(adminCookies))
      .set(CSRF_HEADER_NAME, adminCookies[CSRF_TOKEN_COOKIE])
      .attach('file', Buffer.alloc(12 * 1024 * 1024), {
        filename: 'large.png',
        contentType: 'image/png',
      });
    expect([400, 413]).toContain(tooLargeResponse.status);
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
  overrides: Partial<ReturnType<typeof buildMoviePayload>> = {},
) {
  const response = await request(app.getHttpServer())
    .post('/movies')
    .set('Cookie', toCookieHeader(adminCookies))
    .set(CSRF_HEADER_NAME, adminCookies[CSRF_TOKEN_COOKIE])
    .send(buildMoviePayload(overrides));

  expect(response.status).toBe(201);
  return response.body as { id: string };
}

function buildMoviePayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    title: `Movie ${randomUUID()}`,
    synopsis: 'A full E2E test movie payload',
    genre: 'Action',
    price: 25.5,
    posterUrl: 'https://cdn.example.com/poster.png',
    trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    ...overrides,
  };
}
