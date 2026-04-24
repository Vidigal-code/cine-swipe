import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  IPaymentGateway,
  ProcessPaymentInput,
  ProcessPaymentResult,
} from '../../application/payment/interfaces/payment-gateway.interface';

@Injectable()
export class StripeGateway implements IPaymentGateway {
  private stripeClient: Stripe | null = null;
  private readonly paymentMethod: string;

  constructor(private readonly configService: ConfigService) {
    this.paymentMethod = this.configService.get<string>(
      'STRIPE_TEST_PAYMENT_METHOD',
      'pm_card_visa',
    );
  }

  async processPayment(
    input: ProcessPaymentInput,
  ): Promise<ProcessPaymentResult> {
    const stripe = this.getStripeClient();
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: this.toMinorUnits(input.amount),
        currency: input.currency,
        payment_method: this.paymentMethod,
        confirm: true,
        metadata: {
          purchaseId: input.purchaseId,
          correlationId: input.correlationId,
        },
      },
      {
        idempotencyKey: input.correlationId,
      },
    );

    return {
      approved: paymentIntent.status === 'succeeded',
      externalReference: paymentIntent.id,
      failureReason: paymentIntent.last_payment_error?.message,
    };
  }

  private toMinorUnits(amount: number): number {
    return Math.round(amount * 100);
  }

  private getStripeClient(): Stripe {
    if (this.stripeClient) {
      return this.stripeClient;
    }

    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!apiKey) {
      throw new Error(
        'STRIPE_SECRET_KEY is required when PAYMENT_PROVIDER=stripe',
      );
    }

    this.stripeClient = new Stripe(apiKey);
    return this.stripeClient;
  }
}
