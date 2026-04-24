import { of, type Observable } from 'rxjs';

export interface PublishedMessage {
  pattern: string;
  payload: unknown;
}

export class FakeRabbitClient {
  private readonly messages: PublishedMessage[] = [];

  emit(pattern: string, payload: unknown): Observable<boolean> {
    this.messages.push({ pattern, payload });
    return of(true);
  }

  getMessages(pattern?: string): PublishedMessage[] {
    if (!pattern) {
      return [...this.messages];
    }
    return this.messages.filter((message) => message.pattern === pattern);
  }

  popFirstMessage(pattern: string): PublishedMessage | undefined {
    const index = this.messages.findIndex(
      (message) => message.pattern === pattern,
    );
    if (index < 0) {
      return undefined;
    }
    const [message] = this.messages.splice(index, 1);
    return message;
  }

  clear(): void {
    this.messages.length = 0;
  }
}
