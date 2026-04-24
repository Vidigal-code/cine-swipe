import { Controller, Get } from '@nestjs/common';
import { ResponseFactory } from '../../shared/http-response/response.factory';
import type { HealthResponse } from '../../shared/http-response/response.types';

@Controller('health')
export class HealthController {
  constructor(private readonly responseFactory: ResponseFactory) {}

  @Get()
  getHealth(): HealthResponse {
    return this.responseFactory.health();
  }
}
