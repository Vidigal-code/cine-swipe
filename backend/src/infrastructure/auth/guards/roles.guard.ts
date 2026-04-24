import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../../domain/user/entities/user.entity';
import { ROLES_KEY } from '../roles.decorator';
import { ACCESS_TOKEN_COOKIE } from '../../../shared/auth/auth-cookie.config';
import { AUTH_MESSAGES_PT_BR } from '../../../shared/auth/auth-messages.pt-br';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: { role?: string };
      cookies?: Record<string, string>;
      headers: { authorization?: string };
    }>();

    const role = await this.resolveRole(request);
    if (!role || !requiredRoles.includes(role as UserRole)) {
      throw new ForbiddenException(AUTH_MESSAGES_PT_BR.insufficientPermissions);
    }

    return true;
  }

  private async resolveRole(request: {
    user?: { role?: string };
    cookies?: Record<string, string>;
    headers: { authorization?: string };
  }): Promise<string> {
    if (request.user?.role) {
      return request.user.role;
    }

    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException(
        AUTH_MESSAGES_PT_BR.authenticationRequired,
      );
    }

    try {
      const secret = this.configService.getOrThrow<string>('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync<{ role?: string }>(
        token,
        {
          secret,
        },
      );
      return payload.role ?? '';
    } catch {
      throw new UnauthorizedException(
        AUTH_MESSAGES_PT_BR.invalidOrExpiredToken,
      );
    }
  }

  private extractToken(request: {
    cookies?: Record<string, string>;
    headers: { authorization?: string };
  }): string | undefined {
    const fromCookie = request.cookies?.[ACCESS_TOKEN_COOKIE];
    if (fromCookie) {
      return fromCookie;
    }

    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
