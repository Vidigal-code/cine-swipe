import type { RmqContext } from '@nestjs/microservices';
interface RmqContextMock {
    ack: jest.Mock<void, [unknown]>;
    context: RmqContext;
}
export declare function createRmqContextMock(): RmqContextMock;
export {};
