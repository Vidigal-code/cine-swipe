import { Purchase } from '../entities/purchase.entity';

export const PURCHASE_REPOSITORY = 'PURCHASE_REPOSITORY';

export interface IPurchaseRepository {
    create(purchase: Partial<Purchase>): Promise<Purchase>;
    findById(id: string): Promise<Purchase | null>;
    updateStatus(id: string, status: string): Promise<Purchase>;
    findByUser(userId: string): Promise<Purchase[]>;
}
