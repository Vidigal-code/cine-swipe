import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';
import { UserRole } from '../../../../domain/user/entities/user.entity';
import {
  STRONG_PASSWORD_MESSAGE,
  STRONG_PASSWORD_REGEX,
} from '../../../../shared/auth/password-policy';

export class RegisterDto {
  @IsOptional()
  @IsString()
  username?: string;

  @ValidateIf((payload: RegisterDto) => !payload.firebaseIdToken)
  @IsEmail()
  email?: string;

  @ValidateIf((payload: RegisterDto) => !payload.firebaseIdToken)
  @IsString()
  @Matches(STRONG_PASSWORD_REGEX, {
    message: STRONG_PASSWORD_MESSAGE,
  })
  password?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  firebaseIdToken?: string;

  @IsOptional()
  @IsString()
  referralCode?: string;
}
