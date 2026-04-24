import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeWebhookService {
  private stripeClient: Stripe | null = null;

  constructor(private readonly configService: ConfigService) {}

  constructEvent(rawBody: Buffer, signature: string): Stripe.Event {
    if (!signature) {
      throw new UnauthorizedException('Missing Stripe signature');
    }

    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    if (!webhookSecret) {
      throw new BadRequestException('STRIPE_WEBHOOK_SECRET is not configured');
    }

    return this.getStripeClient().webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  }

  private getStripeClient(): Stripe {
    if (this.stripeClient) {
      return this.stripeClient;
    }

    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!apiKey) {
      throw new BadRequestException('STRIPE_SECRET_KEY is not configured');
    }

    this.stripeClient = new Stripe(apiKey);
    return this.stripeClient;
  }
}
