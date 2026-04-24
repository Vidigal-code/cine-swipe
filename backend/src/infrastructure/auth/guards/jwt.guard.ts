import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../../../domain/user/entities/user.entity';
import {
  ACCESS_TOKEN_COOKIE,
  CSRF_HEADER_NAME,
  CSRF_TOKEN_COOKIE,
  csrfEnabled,
} from '../../../shared/auth/auth-cookie.config';
import { AUTH_MESSAGES_PT_BR } from '../../../shared/auth/auth-messages.pt-br';

type AuthenticatedRequest = Request & {
  user?: {
    sub: string;
    username: string;
    email: string;
    role: UserRole;
  };
  cookies?: Record<string, string>;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const { token, source } = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException(
        AUTH_MESSAGES_PT_BR.authenticationRequired,
      );
    }

    try {
      const secret = this.configService.getOrThrow<string>('JWT_SECRET');

      // @ts-expect-error
      request.user = await this.jwtService.verifyAsync(token, { secret });
      this.validateCsrfIfRequired(request, source);
    } catch {
      throw new UnauthorizedException(
        AUTH_MESSAGES_PT_BR.invalidOrExpiredToken,
      );
    }
    return true;
  }

  private extractToken(request: AuthenticatedRequest): {
    token?: string;
    source: 'cookie' | 'header' | 'none';
  } {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const fromCookie = request.cookies?.[ACCESS_TOKEN_COOKIE];
    if (fromCookie) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      return { token: fromCookie, source: 'cookie' };
    }

    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer' && token) {
      return { token, source: 'header' };
    }
    return { source: 'none' };
  }

  private validateCsrfIfRequired(
    request: AuthenticatedRequest,
    tokenSource: 'cookie' | 'header' | 'none',
  ): void {
    if (!csrfEnabled(this.configService) || tokenSource !== 'cookie') {
      return;
    }
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method.toUpperCase())) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const csrfCookie = request.cookies?.[CSRF_TOKEN_COOKIE];
    const csrfHeader = request.headers[CSRF_HEADER_NAME] as string | undefined;
    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      throw new UnauthorizedException(AUTH_MESSAGES_PT_BR.csrfValidationFailed);
    }
  }
}
