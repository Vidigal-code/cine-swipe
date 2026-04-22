import { Inject, Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

import { USER_REPOSITORY } from '../../domain/user/interfaces/user.repository';
import type { IUserRepository } from '../../domain/user/interfaces/user.repository';
import { User } from '../../domain/user/entities/user.entity';

@Injectable()
export class AuthService {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    // Local Mock Registration
    async register(data: Partial<User>): Promise<{ user: User; accessToken: string }> {
        const existing = await this.userRepository.findByEmail(data.email!);
        if (existing) {
            throw new ConflictException('Email already in use');
        }

        let passwordHash = '';
        if (data.passwordHash) { // using field conditionally as the raw password
            const salt = await bcrypt.genSalt(10);
            passwordHash = await bcrypt.hash(data.passwordHash, salt);
        }

        const user = await this.userRepository.create({
            ...data,
            passwordHash,
        });

        const accessToken = this.generateToken(user);
        // don't leak hash
        const { passwordHash: _ph, ...cleanUser } = user;

        return { user: cleanUser as User, accessToken };
    }

    // Local Mock Login
    async login(email: string, passwordRaw: string): Promise<{ user: User; accessToken: string }> {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(passwordRaw, user.passwordHash);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const accessToken = this.generateToken(user);
        const { passwordHash: _ph, ...cleanUser } = user;
        return { user: cleanUser as User, accessToken };
    }

    private generateToken(user: User): string {
        const payload = { sub: user.id, email: user.email, role: user.role };
        return this.jwtService.sign(payload);
    }
}
