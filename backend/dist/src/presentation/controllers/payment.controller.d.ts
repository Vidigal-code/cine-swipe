import { PaymentService } from '../../application/payment/payment.service';
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
export declare class PaymentController {
    private readonly paymentService;
    private readonly responseFactory;
    constructor(paymentService: PaymentService, responseFactory: ResponseFactory);
    checkout(req: AuthenticatedRequest, body: CheckoutDto): Promise<Purchase>;
    getMyMovies(req: AuthenticatedRequest, query: PaginationQueryDto): Promise<PaginatedResponse<Movie>>;
}
export {};
