import { ConfigService } from '@nestjs/config';
import { RmqContext } from '@nestjs/microservices';
import { PaymentGatewayFactory } from '../../infrastructure/payment/payment-gateway.factory';
import { CreditService } from '../../application/credit/credit.service';
import { ClientProxy } from '@nestjs/microservices';
interface CreditCheckoutRequestedEvent {
    creditPurchaseId: string;
    amountBrl: number;
    creditsAmount: number;
    provider: string;
    correlationId: string;
    retryCount: number;
}
export declare class CreditPaymentWorker {
    private readonly creditService;
    private readonly paymentGatewayFactory;
    private readonly configService;
    private readonly rabbitClient;
    private readonly deadLetterClient;
    constructor(creditService: CreditService, paymentGatewayFactory: PaymentGatewayFactory, configService: ConfigService, rabbitClient: ClientProxy, deadLetterClient: ClientProxy);
    handleProcessCreditPayment(event: CreditCheckoutRequestedEvent, context: RmqContext): Promise<void>;
    private shouldRetry;
    private requeue;
    private sendToDlq;
}
export {};
