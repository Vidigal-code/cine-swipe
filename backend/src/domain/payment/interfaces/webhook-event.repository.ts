export const WEBHOOK_EVENT_REPOSITORY = 'WEBHOOK_EVENT_REPOSITORY';

export interface IWebhookEventRepository {
  hasBeenProcessed(eventId: string): Promise<boolean>;
  markAsProcessed(eventId: string): Promise<void>;
}
