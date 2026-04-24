export declare enum CreditPurchaseStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}
export declare class CreditPurchase {
    id: string;
    userId: string;
    creditPlanId: string;
    creditsAmount: number;
    amountBrl: number;
    status: CreditPurchaseStatus;
    provider: string;
    correlationId: string;
    stripePaymentIntentId: string | null;
    failureReason: string | null;
    createdAt: Date;
    updatedAt: Date;
}
