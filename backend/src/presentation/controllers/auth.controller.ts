import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from '../../application/auth/auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    async register(@Body() body: any) {
        // Basic explicit map to domain dto
        return this.authService.register({
            email: body.email,
            passwordHash: body.password, // map raw password to hash arg
            role: body.role,
        });
    }

    @Post('login')
    async login(@Body() body: any) {
        return this.authService.login(body.email, body.password);
    }
}
