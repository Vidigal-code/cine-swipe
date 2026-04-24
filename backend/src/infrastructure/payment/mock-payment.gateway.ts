import { Injectable } from '@nestjs/common';
import {
  IPaymentGateway,
  ProcessPaymentInput,
  ProcessPaymentResult,
} from '../../application/payment/interfaces/payment-gateway.interface';

@Injectable()
export class MockPaymentGateway implements IPaymentGateway {
  async processPayment(
    input: ProcessPaymentInput,
  ): Promise<ProcessPaymentResult> {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {
      approved: true,
      externalReference: `mock_${input.correlationId}`,
    };
  }
}
