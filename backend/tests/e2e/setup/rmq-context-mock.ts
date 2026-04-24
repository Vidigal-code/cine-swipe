import type { RmqContext } from '@nestjs/microservices';

interface ChannelMock {
  ack: jest.Mock<void, [unknown]>;
}

interface RmqContextMock {
  ack: jest.Mock<void, [unknown]>;
  context: RmqContext;
}

export function createRmqContextMock(): RmqContextMock {
  const ack = jest.fn<void, [unknown]>();
  const channel: ChannelMock = {
    ack,
  };
  const message = { fields: { deliveryTag: 1 } };

  const context = {
    getChannelRef: () => channel,
    getMessage: () => message,
  } as unknown as RmqContext;

  return {
    ack,
    context,
  };
}
