import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ConsumeCreditsDto {
  @IsInt()
  @Min(1)
  amount!: number;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  correlationId?: string;
}
