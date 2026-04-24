import { IsString, Matches } from 'class-validator';
import {
  STRONG_PASSWORD_MESSAGE,
  STRONG_PASSWORD_REGEX,
} from '../../../../shared/auth/password-policy';

export class UpdatePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @Matches(STRONG_PASSWORD_REGEX, {
    message: STRONG_PASSWORD_MESSAGE,
  })
  newPassword!: string;
}
