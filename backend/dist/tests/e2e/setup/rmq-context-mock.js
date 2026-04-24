"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRmqContextMock = createRmqContextMock;
function createRmqContextMock() {
    const ack = jest.fn();
    const channel = {
        ack,
    };
    const message = { fields: { deliveryTag: 1 } };
    const context = {
        getChannelRef: () => channel,
        getMessage: () => message,
    };
    return {
        ack,
        context,
    };
}
//# sourceMappingURL=rmq-context-mock.js.map