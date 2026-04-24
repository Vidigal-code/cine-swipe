import { Module } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { AdminSeedService } from './admin-seed.service';

@Module({
  providers: [PrismaService, AdminSeedService],
  exports: [PrismaService],
})
export class DatabaseModule {}
