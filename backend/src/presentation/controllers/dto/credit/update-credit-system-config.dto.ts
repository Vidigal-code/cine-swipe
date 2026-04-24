import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateCreditSystemConfigDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  registrationBonusCredits?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  referralEnabled?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  refereeRegistrationBonusCredits?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  referrerFirstPurchaseBonusCredits?: number;
}
