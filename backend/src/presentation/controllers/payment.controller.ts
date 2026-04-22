import { Controller, Post, Body, Req, UseGuards, Get } from '@nestjs/common';
import { PaymentService } from '../../application/payment/payment.service';
import { JwtAuthGuard } from '../../infrastructure/auth/guards/jwt.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post('checkout')
    async checkout(@Req() req: any, @Body() body: { movieId: string }) {
        const userId = req.user.sub;
        return this.paymentService.checkout(userId, body.movieId);
    }

    @Get('my-movies')
    async getMyMovies(@Req() req: any) {
        const userId = req.user.sub;
        const purchases = await this.paymentService.getUserPurchases(userId);
        // Return only the COMPLETED movies
        return purchases
            .filter((p) => p.status === 'COMPLETED')
            .map((p) => p.movie);
    }
}
