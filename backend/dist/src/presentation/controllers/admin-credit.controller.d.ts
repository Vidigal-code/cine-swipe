import { CreditService } from '../../application/credit/credit.service';
import { ResponseFactory } from '../../shared/http-response/response.factory';
import { PaginationQueryDto } from '../../shared/pagination/pagination-query.dto';
import { CreateCreditPlanDto } from './dto/credit/create-credit-plan.dto';
import { UpdateCreditPlanDto } from './dto/credit/update-credit-plan.dto';
import { UpdateCreditSystemConfigDto } from './dto/credit/update-credit-system-config.dto';
import type { PaginatedResponse } from '../../shared/http-response/response.types';
import { CreditPlan } from '../../domain/credit/entities/credit-plan.entity';
import { CreditSystemConfig } from '../../domain/credit/entities/credit-system-config.entity';
export declare class AdminCreditController {
    private readonly creditService;
    private readonly responseFactory;
    constructor(creditService: CreditService, responseFactory: ResponseFactory);
    getPlans(query: PaginationQueryDto): Promise<PaginatedResponse<CreditPlan>>;
    createPlan(body: CreateCreditPlanDto): Promise<CreditPlan>;
    updatePlan(id: string, body: UpdateCreditPlanDto): Promise<CreditPlan>;
    deletePlan(id: string): Promise<import("../../shared/http-response/response.types").SuccessResponse>;
    getConfig(): Promise<CreditSystemConfig>;
    updateConfig(body: UpdateCreditSystemConfigDto): Promise<CreditSystemConfig>;
}
