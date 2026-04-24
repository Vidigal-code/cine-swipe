import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IPaymentGateway } from '../../application/payment/interfaces/payment-gateway.interface';
import { MockPaymentGateway } from './mock-payment.gateway';
import { StripeGateway } from './stripe.gateway';
import { resolvePaymentProvider } from '../../shared/config/platform.config';

@Injectable()
export class PaymentGatewayFactory {
  constructor(
    private readonly configService: ConfigService,
    private readonly mockPaymentGateway: MockPaymentGateway,
    private readonly stripeGateway: StripeGateway,
  ) {}

  resolveGateway(provider: string): IPaymentGateway {
    if (provider === 'stripe') {
      return this.stripeGateway;
    }

    return this.mockPaymentGateway;
  }

  resolveDefaultProvider(): string {
    return resolvePaymentProvider(this.configService);
  }
}
