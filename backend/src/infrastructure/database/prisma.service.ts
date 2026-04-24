import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { resolveDatabaseProvider } from '../../shared/config/platform.config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly configService: ConfigService) {
    super();
  }

  async onModuleInit(): Promise<void> {
    if (resolveDatabaseProvider(this.configService) !== 'postgres') {
      return;
    }
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    if (resolveDatabaseProvider(this.configService) !== 'postgres') {
      return;
    }
    await this.$disconnect();
  }
}
