import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from '../../application/auth/auth.service';
import { JwtAuthGuard } from '../../infrastructure/auth/guards/jwt.guard';
import {
  ACCESS_TOKEN_COOKIE,
  buildCookieOptions,
  csrfEnabled,
  CSRF_HEADER_NAME,
  CSRF_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '../../shared/auth/auth-cookie.config';
import { LoginDto } from './dto/auth/login.dto';
import { RefreshDto } from './dto/auth/refresh.dto';
import { RegisterDto } from './dto/auth/register.dto';
import { UpdateProfileDto } from './dto/auth/update-profile.dto';
import { UpdatePasswordDto } from './dto/auth/update-password.dto';
import { ResponseFactory } from '../../shared/http-response/response.factory';
import type {
  SuccessResponse,
  UserResponse,
} from '../../shared/http-response/response.types';
import { AUTH_MESSAGES_PT_BR } from '../../shared/auth/auth-messages.pt-br';
import { buildAvatarUploadOptions } from '../../shared/upload/upload-security.config';
import { buildPublicBackendUrl } from '../../shared/config/public-backend-url.util';

type ProfilePayload = Awaited<ReturnType<AuthService['getProfile']>>;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly responseFactory: ResponseFactory,
  ) {}

  @Post('register')
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserResponse<ProfilePayload>> {
    const authResult = await this.authService.register(body);
    this.setAuthCookies(
      response,
      authResult.accessToken,
      authResult.sessionToken,
      authResult.csrfToken,
    );
    return this.responseFactory.user(authResult.user);
  }

  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserResponse<ProfilePayload>> {
    const authResult = await this.authService.login(body);
    this.setAuthCookies(
      response,
      authResult.accessToken,
      authResult.sessionToken,
      authResult.csrfToken,
    );
    return this.responseFactory.user(authResult.user);
  }

  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Body() body: RefreshDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserResponse<ProfilePayload>> {
    this.validateCsrfForRefresh(request);
    const sessionToken = this.extractRefreshToken(request, body);
    const authResult = await this.authService.refresh(sessionToken);
    this.setAuthCookies(
      response,
      authResult.accessToken,
      authResult.sessionToken,
      authResult.csrfToken,
    );
    return this.responseFactory.user(authResult.user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(
    @Req()
    request: Request & { user?: { sub: string } },
  ): Promise<UserResponse<ProfilePayload>> {
    const userId = request.user?.sub;
    if (!userId) {
      throw new UnauthorizedException(AUTH_MESSAGES_PT_BR.userSessionInvalid);
    }
    const profile = await this.authService.getProfile(userId);
    return this.responseFactory.user(profile);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@Res({ passthrough: true }) response: Response): SuccessResponse {
    this.clearAuthCookies(response);
    return this.responseFactory.success(true);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Req() request: Request & { user?: { sub: string } },
    @Body() body: UpdateProfileDto,
  ): Promise<UserResponse<ProfilePayload>> {
    const userId = request.user?.sub;
    if (!userId) {
      throw new UnauthorizedException(AUTH_MESSAGES_PT_BR.userSessionInvalid);
    }
    const updated = await this.authService.updateProfile(userId, body);
    return this.responseFactory.user(updated);
  }

  @Put('password')
  @UseGuards(JwtAuthGuard)
  async updatePassword(
    @Req() request: Request & { user?: { sub: string } },
    @Body() body: UpdatePasswordDto,
  ): Promise<SuccessResponse> {
    const userId = request.user?.sub;
    if (!userId) {
      throw new UnauthorizedException(AUTH_MESSAGES_PT_BR.userSessionInvalid);
    }
    await this.authService.updatePassword(
      userId,
      body.currentPassword,
      body.newPassword,
    );
    return this.responseFactory.success(true);
  }

  @Post('avatar/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', buildAvatarUploadOptions()))
  async uploadAvatar(
    @Req() request: Request & { user?: { sub: string } },
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UserResponse<ProfilePayload>> {
    const userId = request.user?.sub;
    if (!userId) {
      throw new UnauthorizedException(AUTH_MESSAGES_PT_BR.userSessionInvalid);
    }
    if (!file) {
      throw new BadRequestException('Arquivo de avatar obrigatorio.');
    }
    const backendBaseUrl = buildPublicBackendUrl(this.configService, request);
    const avatarUrl = `${backendBaseUrl}/uploads/${encodeURIComponent(file.filename)}`;
    const updated = await this.authService.updateAvatar(userId, avatarUrl);
    return this.responseFactory.user(updated);
  }

  private extractRefreshToken(request: Request, body: RefreshDto): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const fromCookie = request.cookies?.[REFRESH_TOKEN_COOKIE];
    if (fromCookie) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return fromCookie;
    }
    if (body.sessionToken) {
      return body.sessionToken;
    }
    throw new UnauthorizedException(AUTH_MESSAGES_PT_BR.refreshTokenRequired);
  }

  private validateCsrfForRefresh(request: Request): void {
    if (!csrfEnabled(this.configService)) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const csrfCookie = request.cookies?.[CSRF_TOKEN_COOKIE];
    const csrfHeader = request.headers[CSRF_HEADER_NAME] as string | undefined;
    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      throw new UnauthorizedException(AUTH_MESSAGES_PT_BR.csrfValidationFailed);
    }
  }

  private setAuthCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
    csrfToken: string,
  ): void {
    response.cookie(
      ACCESS_TOKEN_COOKIE,
      accessToken,
      buildCookieOptions(this.configService, 'access'),
    );
    response.cookie(
      REFRESH_TOKEN_COOKIE,
      refreshToken,
      buildCookieOptions(this.configService, 'refresh'),
    );
    response.cookie(
      CSRF_TOKEN_COOKIE,
      csrfToken,
      buildCookieOptions(this.configService, 'csrf'),
    );
  }

  private clearAuthCookies(response: Response): void {
    response.clearCookie(
      ACCESS_TOKEN_COOKIE,
      buildCookieOptions(this.configService, 'access'),
    );
    response.clearCookie(
      REFRESH_TOKEN_COOKIE,
      buildCookieOptions(this.configService, 'refresh'),
    );
    response.clearCookie(
      CSRF_TOKEN_COOKIE,
      buildCookieOptions(this.configService, 'csrf'),
    );
  }

}
