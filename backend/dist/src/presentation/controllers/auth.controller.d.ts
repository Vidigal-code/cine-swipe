import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from '../../application/auth/auth.service';
import { LoginDto } from './dto/auth/login.dto';
import { RefreshDto } from './dto/auth/refresh.dto';
import { RegisterDto } from './dto/auth/register.dto';
import { UpdateProfileDto } from './dto/auth/update-profile.dto';
import { UpdatePasswordDto } from './dto/auth/update-password.dto';
import { ResponseFactory } from '../../shared/http-response/response.factory';
import type { SuccessResponse, UserResponse } from '../../shared/http-response/response.types';
type ProfilePayload = Awaited<ReturnType<AuthService['getProfile']>>;
export declare class AuthController {
    private readonly authService;
    private readonly configService;
    private readonly responseFactory;
    constructor(authService: AuthService, configService: ConfigService, responseFactory: ResponseFactory);
    register(body: RegisterDto, response: Response): Promise<UserResponse<ProfilePayload>>;
    login(body: LoginDto, response: Response): Promise<UserResponse<ProfilePayload>>;
    refresh(request: Request, body: RefreshDto, response: Response): Promise<UserResponse<ProfilePayload>>;
    me(request: Request & {
        user?: {
            sub: string;
        };
    }): Promise<UserResponse<ProfilePayload>>;
    logout(response: Response): SuccessResponse;
    updateProfile(request: Request & {
        user?: {
            sub: string;
        };
    }, body: UpdateProfileDto): Promise<UserResponse<ProfilePayload>>;
    updatePassword(request: Request & {
        user?: {
            sub: string;
        };
    }, body: UpdatePasswordDto): Promise<SuccessResponse>;
    uploadAvatar(request: Request & {
        user?: {
            sub: string;
        };
    }, file: Express.Multer.File): Promise<UserResponse<ProfilePayload>>;
    private extractRefreshToken;
    private validateCsrfForRefresh;
    private setAuthCookies;
    private clearAuthCookies;
}
export {};
