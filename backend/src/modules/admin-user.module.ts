import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AdminUserService } from '../application/admin-user/admin-user.service';
import { USER_REPOSITORY } from '../domain/user/interfaces/user.repository';
import type { IUserRepository } from '../domain/user/interfaces/user.repository';
import { JwtAuthGuard } from '../infrastructure/auth/guards/jwt.guard';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { PrismaUserRepository } from '../infrastructure/database/repositories/user.repository';
import { FirebaseUserRepository } from '../infrastructure/firebase/repositories/firebase-user.repository';
import { AdminUserController } from '../presentation/controllers/admin-user.controller';
import { ResponseModule } from '../shared/http-response/response.module';
import { SharedModule } from '../shared/shared.module';
import { pickDatabaseRepository } from '../infrastructure/database/repository-provider.factory';

@Module({
  imports: [DatabaseModule, ResponseModule, SharedModule, JwtModule],
  controllers: [AdminUserController],
  providers: [
    AdminUserService,
    JwtAuthGuard,
    PrismaUserRepository,
    FirebaseUserRepository,
    {
      provide: USER_REPOSITORY,
      inject: [ConfigService, PrismaUserRepository, FirebaseUserRepository],
      useFactory: (
        configService: ConfigService,
        prismaRepository: PrismaUserRepository,
        firebaseRepository: FirebaseUserRepository,
      ): IUserRepository =>
        pickDatabaseRepository<IUserRepository>(configService, {
          postgres: prismaRepository,
          firebase: firebaseRepository,
        }),
    },
  ],
})
export class AdminUserModule {}
