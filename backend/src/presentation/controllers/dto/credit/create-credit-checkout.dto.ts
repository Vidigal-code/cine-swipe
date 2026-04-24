import { IsUUID } from 'class-validator';

export class CreateCreditCheckoutDto {
  @IsUUID()
  creditPlanId!: string;
}
