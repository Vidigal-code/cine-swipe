import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { User } from './domain/user/entities/user.entity';
import { AuthController } from './presentation/controllers/auth.controller';
import { AuthService } from './application/auth/auth.service';
import { TypeOrmUserRepository } from './infrastructure/database/repositories/user.repository';
import { USER_REPOSITORY } from './domain/user/interfaces/user.repository';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET', 'cineswipe-super-secret'),
                signOptions: { expiresIn: '1d' },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        {
            provide: USER_REPOSITORY,
            useClass: TypeOrmUserRepository,
        },
    ],
    exports: [AuthService],
})
export class AuthModule { }
