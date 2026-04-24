import { Injectable } from '@nestjs/common';
import type { IWebhookEventRepository } from '../../../domain/payment/interfaces/webhook-event.repository';
import { FirebaseStateStoreService } from '../firebase-state-store.service';
import { nowIso } from '../firebase-state.utils';

@Injectable()
export class FirebaseWebhookEventRepository implements IWebhookEventRepository {
  constructor(private readonly stateStore: FirebaseStateStoreService) {}

  async hasBeenProcessed(eventId: string): Promise<boolean> {
    const state = await this.stateStore.readState();
    return Boolean(state.processedWebhookEvents[eventId]);
  }

  async markAsProcessed(eventId: string): Promise<void> {
    await this.stateStore.runStateTransaction((state) => {
      state.processedWebhookEvents[eventId] = {
        id: eventId,
        createdAt: nowIso(),
      };
      return true;
    });
  }
}
