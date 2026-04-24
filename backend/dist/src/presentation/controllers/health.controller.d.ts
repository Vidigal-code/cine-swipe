import { ResponseFactory } from '../../shared/http-response/response.factory';
import type { HealthResponse } from '../../shared/http-response/response.types';
export declare class HealthController {
    private readonly responseFactory;
    constructor(responseFactory: ResponseFactory);
    getHealth(): HealthResponse;
}
