import { NestExpressApplication } from '@nestjs/platform-express';
import type Stripe from 'stripe';
import { PaymentOutboxDispatcher } from '../../../src/presentation/workers/payment-outbox.dispatcher';
import { PaymentWorker } from '../../../src/presentation/workers/payment.worker';
import { FakeRabbitClient } from './fake-rabbit-client';
import { createInMemoryRepositories } from './in-memory-repositories';
type StripeWebhookMock = {
    constructEvent: jest.Mock<Stripe.Event, [Buffer, string]>;
};
export interface E2eAppContext {
    app: NestExpressApplication;
    repositories: ReturnType<typeof createInMemoryRepositories>;
    paymentQueueClient: FakeRabbitClient;
    paymentDlqClient: FakeRabbitClient;
    stripeWebhookMock: StripeWebhookMock;
    paymentOutboxDispatcher: PaymentOutboxDispatcher;
    paymentWorker: PaymentWorker;
    resetState: () => void;
    close: () => Promise<void>;
}
export declare function createE2eApp(): Promise<E2eAppContext>;
export declare function getCheckoutEvent(queueClient: FakeRabbitClient): {
    purchaseId: string;
    amount: number;
    provider: string;
    correlationId: string;
    retryCount: number;
};
export declare function getDlqMessages(queueClient: FakeRabbitClient): import("./fake-rabbit-client").PublishedMessage[];
export {};
