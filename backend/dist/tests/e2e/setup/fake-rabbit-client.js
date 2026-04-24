"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakeRabbitClient = void 0;
const rxjs_1 = require("rxjs");
class FakeRabbitClient {
    messages = [];
    emit(pattern, payload) {
        this.messages.push({ pattern, payload });
        return (0, rxjs_1.of)(true);
    }
    getMessages(pattern) {
        if (!pattern) {
            return [...this.messages];
        }
        return this.messages.filter((message) => message.pattern === pattern);
    }
    popFirstMessage(pattern) {
        const index = this.messages.findIndex((message) => message.pattern === pattern);
        if (index < 0) {
            return undefined;
        }
        const [message] = this.messages.splice(index, 1);
        return message;
    }
    clear() {
        this.messages.length = 0;
    }
}
exports.FakeRabbitClient = FakeRabbitClient;
//# sourceMappingURL=fake-rabbit-client.js.map