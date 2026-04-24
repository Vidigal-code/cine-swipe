import { Module } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { AdminSeedService } from './admin-seed.service';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import { FirebaseStateStoreService } from '../firebase/firebase-state-store.service';

@Module({
  providers: [
    PrismaService,
    AdminSeedService,
    FirebaseAdminService,
    FirebaseStateStoreService,
  ],
  exports: [PrismaService, FirebaseAdminService, FirebaseStateStoreService],
})
export class DatabaseModule {}
