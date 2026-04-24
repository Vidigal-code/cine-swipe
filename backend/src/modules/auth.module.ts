import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from '../presentation/controllers/auth.controller';
import { AuthService } from '../application/auth/auth.service';
import { PrismaUserRepository } from '../infrastructure/database/repositories/user.repository';
import { USER_REPOSITORY } from '../domain/user/interfaces/user.repository';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { FirebaseAuthService } from 'src/infrastructure/auth/firebase-auth.service';
import { AuthProviderService } from 'src/application/auth/auth-provider.service';
import { JwtAuthGuard } from '../infrastructure/auth/guards/jwt.guard';
import { ResponseModule } from '../shared/http-response/response.module';
import { CreditModule } from './credit.module';

@Module({
  imports: [
    DatabaseModule,
    ResponseModule,
    CreditModule,
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
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
