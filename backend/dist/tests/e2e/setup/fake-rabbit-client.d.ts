import { type Observable } from 'rxjs';
export interface PublishedMessage {
    pattern: string;
    payload: unknown;
}
export declare class FakeRabbitClient {
    private readonly messages;
    emit(pattern: string, payload: unknown): Observable<boolean>;
    getMessages(pattern?: string): PublishedMessage[];
    popFirstMessage(pattern: string): PublishedMessage | undefined;
    clear(): void;
}
