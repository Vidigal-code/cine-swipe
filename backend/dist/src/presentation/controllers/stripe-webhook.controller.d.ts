import type { Request } from 'express';
import { PaymentService } from '../../application/payment/payment.service';
import { ResponseFactory } from '../../shared/http-response/response.factory';
import type { ReceivedResponse } from '../../shared/http-response/response.types';
type StripeRequest = Request & {
    rawBody?: Buffer;
};
export declare class StripeWebhookController {
    private readonly paymentService;
    private readonly responseFactory;
    constructor(paymentService: PaymentService, responseFactory: ResponseFactory);
    handleStripeWebhook(request: StripeRequest, signature: string): Promise<ReceivedResponse>;
}
export {};
