import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreditService } from '../../application/credit/credit.service';
import { JwtAuthGuard } from '../../infrastructure/auth/guards/jwt.guard';
import { Roles } from '../../infrastructure/auth/roles.decorator';
import { UserRole } from '../../domain/user/entities/user.entity';
import { ResponseFactory } from '../../shared/http-response/response.factory';
import { PaginationQueryDto } from '../../shared/pagination/pagination-query.dto';
import { CreateCreditPlanDto } from './dto/credit/create-credit-plan.dto';
import { UpdateCreditPlanDto } from './dto/credit/update-credit-plan.dto';
import { UpdateCreditSystemConfigDto } from './dto/credit/update-credit-system-config.dto';
import type { PaginatedResponse } from '../../shared/http-response/response.types';
import { CreditPlan } from '../../domain/credit/entities/credit-plan.entity';
import { CreditSystemConfig } from '../../domain/credit/entities/credit-system-config.entity';

@Controller('admin/credits')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
export class AdminCreditController {
  constructor(
    private readonly creditService: CreditService,
    private readonly responseFactory: ResponseFactory,
  ) {}

  @Get('plans')
  async getPlans(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<CreditPlan>> {
    const plans = await this.creditService.listAdminPlansPage(query);
    return this.responseFactory.paginated(plans);
  }

  @Post('plans')
  async createPlan(@Body() body: CreateCreditPlanDto): Promise<CreditPlan> {
    const plan = await this.creditService.createAdminPlan(body);
    return this.responseFactory.resource(plan);
  }

  @Patch('plans/:id')
  async updatePlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateCreditPlanDto,
  ): Promise<CreditPlan> {
    const plan = await this.creditService.updateAdminPlan(id, body);
    return this.responseFactory.resource(plan);
  }

  @Delete('plans/:id')
  async deletePlan(@Param('id', ParseUUIDPipe) id: string) {
    await this.creditService.deleteAdminPlan(id);
    return this.responseFactory.success(true);
  }

  @Get('config')
  async getConfig(): Promise<CreditSystemConfig> {
    const config = await this.creditService.getAdminConfig();
    return this.responseFactory.resource(config);
  }

  @Patch('config')
  async updateConfig(
    @Body() body: UpdateCreditSystemConfigDto,
  ): Promise<CreditSystemConfig> {
    const config = await this.creditService.updateAdminConfig(body);
    return this.responseFactory.resource(config);
  }
}
