import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { UserRole } from '../../../../domain/user/entities/user.entity';
import {
  STRONG_PASSWORD_MESSAGE,
  STRONG_PASSWORD_REGEX,
} from '../../../../shared/auth/password-policy';

export class CreateAdminUserDto {
  @IsString()
  @MaxLength(80)
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @Matches(STRONG_PASSWORD_REGEX, {
    message: STRONG_PASSWORD_MESSAGE,
  })
  password!: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
