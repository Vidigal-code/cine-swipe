import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from '../presentation/controllers/auth.controller';
import { AuthService } from '../application/auth/auth.service';
import { PrismaUserRepository } from '../infrastructure/database/repositories/user.repository';
import { USER_REPOSITORY } from '../domain/user/interfaces/user.repository';
import type { IUserRepository } from '../domain/user/interfaces/user.repository';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { FirebaseAuthService } from 'src/infrastructure/auth/firebase-auth.service';
import { AuthProviderService } from 'src/application/auth/auth-provider.service';
import { JwtAuthGuard } from '../infrastructure/auth/guards/jwt.guard';
import { ResponseModule } from '../shared/http-response/response.module';
import { CreditModule } from './credit.module';
import { FirebaseUserRepository } from '../infrastructure/firebase/repositories/firebase-user.repository';
import { pickDatabaseRepository } from '../infrastructure/database/repository-provider.factory';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    DatabaseModule,
    ResponseModule,
    CreditModule,
    SharedModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        global: true,
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          expiresIn: configService.get<string>('JWT_EXPIRATION', '1d') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthProviderService,
    FirebaseAuthService,
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
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
