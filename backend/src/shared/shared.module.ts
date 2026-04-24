import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaginationService } from './pagination/pagination.service';
import { MediaStorageService } from '../application/media/media-storage.service';
import { DatabaseModule } from '../infrastructure/database/database.module';

@Module({
  imports: [ConfigModule, DatabaseModule],
  providers: [PaginationService, MediaStorageService],
  exports: [PaginationService, MediaStorageService],
})
export class SharedModule {}
