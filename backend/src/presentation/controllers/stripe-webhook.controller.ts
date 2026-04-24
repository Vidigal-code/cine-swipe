import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { PaymentService } from '../../application/payment/payment.service';
import { ResponseFactory } from '../../shared/http-response/response.factory';
import type { ReceivedResponse } from '../../shared/http-response/response.types';

type StripeRequest = Request & { rawBody?: Buffer };

@Controller('payments/webhook')
export class StripeWebhookController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly responseFactory: ResponseFactory,
  ) {}

  @Post('stripe')
  @HttpCode(200)
  async handleStripeWebhook(
    @Req() request: StripeRequest,
    @Headers('stripe-signature') signature: string,
  ): Promise<ReceivedResponse> {
    const rawBody = request.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Stripe raw body is required');
    }

    await this.paymentService.handleStripeWebhook(rawBody, signature);
    return this.responseFactory.received();
  }
}
