import { IPaymentGateway, ProcessPaymentInput, ProcessPaymentResult } from '../../application/payment/interfaces/payment-gateway.interface';
export declare class MockPaymentGateway implements IPaymentGateway {
    processPayment(input: ProcessPaymentInput): Promise<ProcessPaymentResult>;
}
