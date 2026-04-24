import { CreditService } from '../../application/credit/credit.service';
import { ResponseFactory } from '../../shared/http-response/response.factory';
import { PaginationQueryDto } from '../../shared/pagination/pagination-query.dto';
import { CreateCreditCheckoutDto } from './dto/credit/create-credit-checkout.dto';
import { ConsumeCreditsDto } from './dto/credit/consume-credits.dto';
import type { PaginatedResponse } from '../../shared/http-response/response.types';
import { CreditPlan } from '../../domain/credit/entities/credit-plan.entity';
type AuthenticatedRequest = {
    user: {
        sub: string;
        role: string;
    };
};
export declare class CreditController {
    private readonly creditService;
    private readonly responseFactory;
    constructor(creditService: CreditService, responseFactory: ResponseFactory);
    getBalance(req: AuthenticatedRequest): Promise<{
        balance: number;
    }>;
    getPlans(query: PaginationQueryDto): Promise<PaginatedResponse<CreditPlan>>;
    getHistory(req: AuthenticatedRequest, query: PaginationQueryDto): Promise<PaginatedResponse<unknown>>;
    getPurchases(req: AuthenticatedRequest, query: PaginationQueryDto): Promise<PaginatedResponse<import("../../domain/credit/entities/credit-purchase.entity").CreditPurchase>>;
    checkout(req: AuthenticatedRequest, body: CreateCreditCheckoutDto): Promise<import("../../domain/credit/entities/credit-purchase.entity").CreditPurchase>;
    consume(req: AuthenticatedRequest, body: ConsumeCreditsDto): Promise<import("../../shared/http-response/response.types").SuccessResponse>;
}
export {};
