import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../infrastructure/auth/guards/jwt.guard';
import { Roles } from '../../infrastructure/auth/roles.decorator';
import { UserRole } from '../../domain/user/entities/user.entity';
import { PaymentAuditService } from '../../application/payment/payment-audit.service';
import { PaginationQueryDto } from '../../shared/pagination/pagination-query.dto';
import { PaymentAudit } from '../../domain/payment/entities/payment-audit.entity';
import { ResponseFactory } from '../../shared/http-response/response.factory';
import type { PaginatedResponse } from '../../shared/http-response/response.types';

@Controller('payments/admin')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
export class PaymentAuditController {
  constructor(
    private readonly paymentAuditService: PaymentAuditService,
    private readonly responseFactory: ResponseFactory,
  ) {}

  @Get('audits')
  async listAudits(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<PaymentAudit>> {
    const paginatedAudits = await this.paymentAuditService.getAuditPage(query);
    return this.responseFactory.paginated(paginatedAudits);
  }
}
