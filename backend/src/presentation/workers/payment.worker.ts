import { Controller, Inject } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PURCHASE_REPOSITORY } from '../../domain/payment/interfaces/purchase.repository';
import type { IPurchaseRepository } from '../../domain/payment/interfaces/purchase.repository';
import { PurchaseStatus } from '../../domain/payment/entities/purchase.entity';

@Controller()
export class PaymentWorker {
    constructor(
        @Inject(PURCHASE_REPOSITORY)
        private readonly purchaseRepository: IPurchaseRepository,
    ) { }

    @EventPattern('process_payment')
    async handleProcessPayment(@Payload() data: any) {
        console.log('Received process_payment event:', data);

        // Simulate latency for the provider
        await new Promise(resolve => setTimeout(resolve, 2000));

        /**
         * In a real environment, we'd check if `data.provider === 'stripe'`
         * and call Stripe API. Since it's mock (APP_ENV=local), we approve automatically.
         */

        console.log(`Confirming payment ${data.purchaseId} via provider: ${data.provider}`);
        await this.purchaseRepository.updateStatus(data.purchaseId, PurchaseStatus.COMPLETED);

        console.log(`Payment ${data.purchaseId} confirmed and movie released.`);
    }
}
