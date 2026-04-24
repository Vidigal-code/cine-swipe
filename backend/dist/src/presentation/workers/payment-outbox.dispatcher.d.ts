import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import type { IPurchaseRepository } from '../../domain/payment/interfaces/purchase.repository';
export declare class PaymentOutboxDispatcher implements OnModuleInit, OnModuleDestroy {
    private readonly purchaseRepository;
    private readonly rabbitClient;
    private readonly deadLetterClient;
    private readonly configService;
    private dispatcherTimer;
    private isDispatching;
    constructor(purchaseRepository: IPurchaseRepository, rabbitClient: ClientProxy, deadLetterClient: ClientProxy, configService: ConfigService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    dispatchPendingEvents(): Promise<void>;
    private dispatchEvent;
    private buildPayload;
    private handleDispatchFailure;
    private getRetryDelayMs;
    private publishEvent;
    private publishOutboxFailureToDlq;
    private extractCorrelationId;
}
