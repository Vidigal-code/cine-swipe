import { ConfigService } from '@nestjs/config';
import { IPaymentGateway } from '../../application/payment/interfaces/payment-gateway.interface';
import { MockPaymentGateway } from './mock-payment.gateway';
import { StripeGateway } from './stripe.gateway';
export declare class PaymentGatewayFactory {
    private readonly configService;
    private readonly mockPaymentGateway;
    private readonly stripeGateway;
    constructor(configService: ConfigService, mockPaymentGateway: MockPaymentGateway, stripeGateway: StripeGateway);
    resolveGateway(provider: string): IPaymentGateway;
    resolveDefaultProvider(): string;
}
