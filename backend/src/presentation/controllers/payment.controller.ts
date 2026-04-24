import {
  Body,
  Controller,
  Get,
  Query,
  Req,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from '../../application/payment/payment.service';
import { JwtAuthGuard } from '../../infrastructure/auth/guards/jwt.guard';
import { Roles } from '../../infrastructure/auth/roles.decorator';
import { UserRole } from '../../domain/user/entities/user.entity';
import { Movie } from '../../domain/movie/entities/movie.entity';
import { PaginationQueryDto } from '../../shared/pagination/pagination-query.dto';
import { Purchase } from '../../domain/payment/entities/purchase.entity';
import { CheckoutDto } from './dto/payment/checkout.dto';
import { ResponseFactory } from '../../shared/http-response/response.factory';
import type { PaginatedResponse } from '../../shared/http-response/response.types';

type AuthenticatedRequest = {
  user: {
    sub: string;
    role: string;
  };
};

@Controller('payments')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.USER, UserRole.ADMIN)
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly responseFactory: ResponseFactory,
  ) {}

  @Post('checkout')
  async checkout(
    @Req() req: AuthenticatedRequest,
    @Body() body: CheckoutDto,
  ): Promise<Purchase> {
    const userId = req.user.sub;
    const purchase = await this.paymentService.checkout(userId, body.movieId);
    return this.responseFactory.resource(purchase);
  }

  @Get('my-movies')
  async getMyMovies(
    @Req() req: AuthenticatedRequest,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<Movie>> {
    const userId = req.user.sub;
    const paginatedMovies = await this.paymentService.getUserMoviesPage(
      userId,
      query,
    );
    return this.responseFactory.paginated(paginatedMovies);
  }
}
