import { Injectable } from '@nestjs/common';
import type { IWebhookEventRepository } from '../../../domain/payment/interfaces/webhook-event.repository';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaWebhookEventRepository implements IWebhookEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async hasBeenProcessed(eventId: string): Promise<boolean> {
    const existing = await this.prisma.processedWebhookEvent.findUnique({
      where: { eventId },
      select: { id: true },
    });
    return Boolean(existing);
  }

  async markAsProcessed(eventId: string): Promise<void> {
    await this.prisma.processedWebhookEvent.upsert({
      where: { eventId },
      create: { eventId },
      update: {},
    });
  }
}
