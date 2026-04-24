import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../domain/user/entities/user.entity';
import { PrismaService } from './prisma.service';
import { resolveDatabaseProvider } from '../../shared/config/platform.config';

@Injectable()
export class AdminSeedService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (resolveDatabaseProvider(this.configService) !== 'postgres') {
      return;
    }

    const username = this.configService.get<string>('ADMIN_USERNAME');
    const email = this.configService.get<string>('ADMIN_EMAIL');
    const password = this.configService.get<string>('ADMIN_PASSWORD');

    if (!username || !email || !password) {
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const referralCode = this.buildAdminReferralCode(email);
    await this.prisma.user.upsert({
      where: { email },
      update: {
        username,
        role: UserRole.ADMIN,
        passwordHash,
        referralCode,
      },
      create: {
        username,
        email,
        role: UserRole.ADMIN,
        passwordHash,
        referralCode,
      },
    });
  }

  private buildAdminReferralCode(email: string): string {
    return `ref_admin_${email.split('@')[0].toLowerCase()}`;
  }
}
