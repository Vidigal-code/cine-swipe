import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class LoginDto {
  @ValidateIf((payload: LoginDto) => !payload.firebaseIdToken)
  @IsEmail()
  email?: string;

  @ValidateIf((payload: LoginDto) => !payload.firebaseIdToken)
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsString()
  firebaseIdToken?: string;
}
