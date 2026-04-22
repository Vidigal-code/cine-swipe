import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PURCHASE_REPOSITORY } from '../../domain/payment/interfaces/purchase.repository';
import type { IPurchaseRepository } from '../../domain/payment/interfaces/purchase.repository';
import { Purchase, PurchaseStatus } from '../../domain/payment/entities/purchase.entity';
import { MovieService } from '../movie/movie.service';

@Injectable()
export class PaymentService {
    constructor(
        @Inject(PURCHASE_REPOSITORY)
        private readonly purchaseRepository: IPurchaseRepository,
        @Inject('PAYMENT_SERVICE')
        private readonly rabbitClient: ClientProxy,
        private readonly movieService: MovieService,
    ) { }

    async checkout(userId: string, movieId: string): Promise<Purchase> {
        const movie = await this.movieService.getMovieById(movieId);

        // Create Intent
        const purchase = await this.purchaseRepository.create({
            userId,
            movieId,
            amount: movie.price,
            status: PurchaseStatus.PENDING,
        });

        // Send RabbitMQ Event to simulate Provider confirmation
        this.rabbitClient.emit('process_payment', {
            purchaseId: purchase.id,
            amount: movie.price,
            provider: process.env.PAYMENT_PROVIDER || 'mock',
        });

        return purchase;
    }

    async getUserPurchases(userId: string): Promise<Purchase[]> {
        return this.purchaseRepository.findByUser(userId);
    }
}
