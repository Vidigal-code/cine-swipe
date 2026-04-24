import request from 'supertest';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import {
  CSRF_HEADER_NAME,
  CSRF_TOKEN_COOKIE,
} from '../../src/shared/auth/auth-cookie.config';
import {
  createE2eApp,
  getCheckoutEvent,
  type E2eAppContext,
} from './setup/create-e2e-app';
import { mergeCookieJar, toCookieHeader } from './setup/http-helpers';
import { createRmqContextMock } from './setup/rmq-context-mock';
import { PurchaseStatus } from '../../src/domain/payment/entities/purchase.entity';

describe('Payments Async Flow E2E', () => {
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

  it('rejects checkout when request is unauthenticated', async () => {
    const response = await request(app.getHttpServer())
      .post('/payments/checkout')
      .send({ movieId: randomUUID() });

    expect(response.status).toBe(401);
  });

  it('processes checkout asynchronously and delivers movie in my-movies', async () => {
    const adminCookies = await registerAdmin(app);
    const userCookies = await registerUser(app, 'buyer-e2e@mail.local');
    const movie = await createMovie(app, adminCookies);

    const checkoutResponse = await request(app.getHttpServer())
      .post('/payments/checkout')
      .set('Cookie', toCookieHeader(userCookies))
      .set(CSRF_HEADER_NAME, userCookies[CSRF_TOKEN_COOKIE])
      .send({ movieId: movie.id });

    expect(checkoutResponse.status).toBe(201);
    expect(checkoutResponse.body.status).toBe(PurchaseStatus.PENDING);

    await context.paymentOutboxDispatcher.dispatchPendingEvents();
    const event = getCheckoutEvent(context.paymentQueueClient);
    expect(event.purchaseId).toBe(checkoutResponse.body.id);
    expect(event.retryCount).toBe(0);

    const rmq = createRmqContextMock();
    await context.paymentWorker.handleProcessPayment(event, rmq.context);
    expect(rmq.ack).toHaveBeenCalledTimes(1);

    const updatedPurchase =
      await context.repositories.purchaseRepository.findById(
        checkoutResponse.body.id,
      );
    expect(updatedPurchase?.status).toBe(PurchaseStatus.COMPLETED);

    const myMoviesResponse = await request(app.getHttpServer())
      .get('/payments/my-movies?page=1&limit=10')
      .set('Cookie', toCookieHeader(userCookies));
    expect(myMoviesResponse.status).toBe(200);
    expect(myMoviesResponse.body.data).toHaveLength(1);
    expect(myMoviesResponse.body.data[0].id).toBe(movie.id);
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
      title: `Payment Movie ${randomUUID()}`,
      synopsis: 'Movie for payment e2e',
      genre: 'Action',
      price: 32.1,
      posterUrl: 'https://cdn.example.com/poster.png',
      trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    });

  expect(response.status).toBe(201);
  return response.body as { id: string };
}
