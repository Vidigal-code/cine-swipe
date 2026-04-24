import { UserRole } from '../../../../domain/user/entities/user.entity';
export declare class RegisterDto {
    username?: string;
    email?: string;
    password?: string;
    role?: UserRole;
    firebaseIdToken?: string;
    referralCode?: string;
}
