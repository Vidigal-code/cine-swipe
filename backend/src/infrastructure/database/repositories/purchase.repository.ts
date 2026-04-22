import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPurchaseRepository } from '../../../domain/payment/interfaces/purchase.repository';
import { Purchase, PurchaseStatus } from '../../../domain/payment/entities/purchase.entity';

@Injectable()
export class TypeOrmPurchaseRepository implements IPurchaseRepository {
    constructor(
        @InjectRepository(Purchase)
        private readonly repository: Repository<Purchase>,
    ) { }

    async create(purchaseData: Partial<Purchase>): Promise<Purchase> {
        const purchase = this.repository.create(purchaseData);
        return this.repository.save(purchase);
    }

    async findById(id: string): Promise<Purchase | null> {
        return this.repository.findOne({ where: { id }, relations: ['movie', 'user'] });
    }

    async updateStatus(id: string, status: string): Promise<Purchase> {
        await this.repository.update(id, { status: status as PurchaseStatus });
        return this.repository.findOne({ where: { id } }) as Promise<Purchase>;
    }

    async findByUser(userId: string): Promise<Purchase[]> {
        return this.repository.find({ where: { userId }, relations: ['movie'] });
    }
}
