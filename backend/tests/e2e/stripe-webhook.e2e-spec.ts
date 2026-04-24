import request from 'supertest';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import {
  CSRF_HEADER_NAME,
  CSRF_TOKEN_COOKIE,
} from '../../src/shared/auth/auth-cookie.config';
import { PurchaseStatus } from '../../src/domain/payment/entities/purchase.entity';
import { createE2eApp, type E2eAppContext } from './setup/create-e2e-app';
import { mergeCookieJar, toCookieHeader } from './setup/http-helpers';

describe('Stripe Webhook E2E', () => {
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

  it('accepts signed webhook event and syncs purchase status', async () => {
    const adminCookies = await registerAdmin(app);
    const userCookies = await registerUser(app, 'webhook-success@mail.local');
    const movie = await createMovie(app, adminCookies);

    const checkoutResponse = await request(app.getHttpServer())
      .post('/payments/checkout')
      .set('Cookie', toCookieHeader(userCookies))
      .set(CSRF_HEADER_NAME, userCookies[CSRF_TOKEN_COOKIE])
      .send({ movieId: movie.id });
    const purchaseId = checkoutResponse.body.id as string;

    context.stripeWebhookMock.constructEvent.mockReturnValue({
      id: 'evt_success_1',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          metadata: {
            purchaseId,
          },
        },
      },
    } as any);

    const webhookResponse = await request(app.getHttpServer())
      .post('/payments/webhook/stripe')
      .set('stripe-signature', 'signed-valid')
      .send({ event: 'mocked' });

    expect(webhookResponse.status).toBe(200);
    expect(webhookResponse.body).toEqual({ received: true });

    const purchase =
      await context.repositories.purchaseRepository.findById(purchaseId);
    expect(purchase?.status).toBe(PurchaseStatus.COMPLETED);
  });

  it('treats repeated webhook event.id as idempotent', async () => {
    const adminCookies = await registerAdmin(app);
    const userCookies = await registerUser(
      app,
      'webhook-idempotent@mail.local',
    );
    const movie = await createMovie(app, adminCookies);

    const checkoutResponse = await request(app.getHttpServer())
      .post('/payments/checkout')
      .set('Cookie', toCookieHeader(userCookies))
      .set(CSRF_HEADER_NAME, userCookies[CSRF_TOKEN_COOKIE])
      .send({ movieId: movie.id });
    const purchaseId = checkoutResponse.body.id as string;

    context.stripeWebhookMock.constructEvent.mockReturnValue({
      id: 'evt_duplicate_1',
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          metadata: {
            purchaseId,
          },
        },
      },
    } as any);

    const firstWebhookResponse = await request(app.getHttpServer())
      .post('/payments/webhook/stripe')
      .set('stripe-signature', 'signed-valid')
      .send({ event: 'first' });
    expect(firstWebhookResponse.status).toBe(200);

    const afterFirstDelivery =
      await context.repositories.purchaseRepository.findById(purchaseId);
    expect(afterFirstDelivery?.status).toBe(PurchaseStatus.FAILED);

    await context.repositories.purchaseRepository.updateStatus(
      purchaseId,
      PurchaseStatus.PENDING,
    );

    const secondWebhookResponse = await request(app.getHttpServer())
      .post('/payments/webhook/stripe')
      .set('stripe-signature', 'signed-valid')
      .send({ event: 'second' });
    expect(secondWebhookResponse.status).toBe(200);

    const afterSecondDelivery =
      await context.repositories.purchaseRepository.findById(purchaseId);
    expect(afterSecondDelivery?.status).toBe(PurchaseStatus.PENDING);
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
      title: `Webhook Movie ${randomUUID()}`,
      synopsis: 'Movie for stripe webhook e2e',
      genre: 'Thriller',
      price: 18.4,
      posterUrl: 'https://cdn.example.com/poster.png',
      trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    });

  expect(response.status).toBe(201);
  return response.body as { id: string };
}
