import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, IsString, Min } from 'class-validator';

export class CreateCreditPlanDto {
  @IsString()
  name!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  creditsAmount!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  priceBrl!: number;

  @Type(() => Boolean)
  @IsBoolean()
  isActive!: boolean;
}
