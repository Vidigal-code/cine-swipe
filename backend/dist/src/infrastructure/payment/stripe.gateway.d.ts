import { ConfigService } from '@nestjs/config';
import { IPaymentGateway, ProcessPaymentInput, ProcessPaymentResult } from '../../application/payment/interfaces/payment-gateway.interface';
export declare class StripeGateway implements IPaymentGateway {
    private readonly configService;
    private stripeClient;
    private readonly paymentMethod;
    constructor(configService: ConfigService);
    processPayment(input: ProcessPaymentInput): Promise<ProcessPaymentResult>;
    private toMinorUnits;
    private getStripeClient;
}
