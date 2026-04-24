import { UserRole } from '../../../../domain/user/entities/user.entity';
export declare class CreateAdminUserDto {
    username: string;
    email: string;
    password: string;
    role?: UserRole;
}
