export interface ProcessPaymentInput {
    purchaseId: string;
    amount: number;
    currency: string;
    correlationId: string;
}
export interface ProcessPaymentResult {
    approved: boolean;
    externalReference?: string;
    failureReason?: string;
}
export interface IPaymentGateway {
    processPayment(input: ProcessPaymentInput): Promise<ProcessPaymentResult>;
}
