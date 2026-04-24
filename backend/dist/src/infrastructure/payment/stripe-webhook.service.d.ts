import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
export declare class StripeWebhookService {
    private readonly configService;
    private stripeClient;
    constructor(configService: ConfigService);
    constructEvent(rawBody: Buffer, signature: string): Stripe.Event;
    private getStripeClient;
}
