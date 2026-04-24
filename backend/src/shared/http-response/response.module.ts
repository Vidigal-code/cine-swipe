import { Module } from '@nestjs/common';
import { ResponseFactory } from './response.factory';

@Module({
  providers: [ResponseFactory],
  exports: [ResponseFactory],
})
export class ResponseModule {}
