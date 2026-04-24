import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminUserService } from '../application/admin-user/admin-user.service';
import { USER_REPOSITORY } from '../domain/user/interfaces/user.repository';
import { JwtAuthGuard } from '../infrastructure/auth/guards/jwt.guard';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { PrismaUserRepository } from '../infrastructure/database/repositories/user.repository';
import { AdminUserController } from '../presentation/controllers/admin-user.controller';
import { ResponseModule } from '../shared/http-response/response.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [DatabaseModule, ResponseModule, SharedModule, JwtModule],
  controllers: [AdminUserController],
  providers: [
    AdminUserService,
    JwtAuthGuard,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
  ],
})
export class AdminUserModule {}
