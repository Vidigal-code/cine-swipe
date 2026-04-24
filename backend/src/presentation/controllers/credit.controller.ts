import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreditService } from '../../application/credit/credit.service';
import { JwtAuthGuard } from '../../infrastructure/auth/guards/jwt.guard';
import { Roles } from '../../infrastructure/auth/roles.decorator';
import { UserRole } from '../../domain/user/entities/user.entity';
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

@Controller('credits')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.USER, UserRole.ADMIN)
export class CreditController {
  constructor(
    private readonly creditService: CreditService,
    private readonly responseFactory: ResponseFactory,
  ) {}

  @Get('balance')
  async getBalance(
    @Req() req: AuthenticatedRequest,
  ): Promise<{ balance: number }> {
    const balance = await this.creditService.getUserBalance(req.user.sub);
    return this.responseFactory.resource({ balance });
  }

  @Get('plans')
  async getPlans(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<CreditPlan>> {
    const plans = await this.creditService.getActivePlansPage(query);
    return this.responseFactory.paginated(plans);
  }

  @Get('history')
  async getHistory(
    @Req() req: AuthenticatedRequest,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<unknown>> {
    const result = await this.creditService.getUserTransactionsPage(
      req.user.sub,
      query,
    );
    return this.responseFactory.paginated(result);
  }

  @Get('purchases')
  async getPurchases(
    @Req() req: AuthenticatedRequest,
    @Query() query: PaginationQueryDto,
  ) {
    const result = await this.creditService.getUserCreditPurchasesPage(
      req.user.sub,
      query,
    );
    return this.responseFactory.paginated(result);
  }

  @Post('checkout')
  async checkout(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateCreditCheckoutDto,
  ) {
    const purchase = await this.creditService.createCheckout(
      req.user.sub,
      body.creditPlanId,
    );
    return this.responseFactory.resource(purchase);
  }

  @Post('consume')
  async consume(
    @Req() req: AuthenticatedRequest,
    @Body() body: ConsumeCreditsDto,
  ) {
    await this.creditService.consumeCredits(
      req.user.sub,
      body.amount,
      body.description,
      body.correlationId,
    );
    return this.responseFactory.success(true);
  }
}
