import { RmqContext } from '@nestjs/microservices';
import type { IPurchaseRepository } from '../../domain/payment/interfaces/purchase.repository';
import { PaymentGatewayFactory } from '../../infrastructure/payment/payment-gateway.factory';
import { PaymentService } from '../../application/payment/payment.service';
import { ConfigService } from '@nestjs/config';
interface CheckoutRequestedEvent {
    purchaseId: string;
    amount: number;
    provider: string;
    correlationId: string;
    retryCount: number;
}
export declare class PaymentWorker {
    private readonly purchaseRepository;
    private readonly paymentGatewayFactory;
    private readonly paymentService;
    private readonly configService;
    constructor(purchaseRepository: IPurchaseRepository, paymentGatewayFactory: PaymentGatewayFactory, paymentService: PaymentService, configService: ConfigService);
    handleProcessPayment(event: CheckoutRequestedEvent, context: RmqContext): Promise<void>;
    private shouldRetry;
    private requeueWithNextRetry;
    private moveToDlqSafely;
}
export {};
