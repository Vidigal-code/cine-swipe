import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import type { ICreditRepository } from '../../domain/credit/interfaces/credit.repository';
export declare class CreditOutboxDispatcher implements OnModuleInit, OnModuleDestroy {
    private readonly creditRepository;
    private readonly rabbitClient;
    private readonly deadLetterClient;
    private readonly configService;
    private dispatcherTimer;
    private isDispatching;
    constructor(creditRepository: ICreditRepository, rabbitClient: ClientProxy, deadLetterClient: ClientProxy, configService: ConfigService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    dispatchPendingEvents(): Promise<void>;
    private dispatchEvent;
    private publishEvent;
    private handleDispatchFailure;
    private getRetryDelayMs;
    private publishOutboxFailureToDlq;
}
