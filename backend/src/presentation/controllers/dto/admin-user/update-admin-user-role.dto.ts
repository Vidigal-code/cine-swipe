import { IsEnum } from 'class-validator';
import { UserRole } from '../../../../domain/user/entities/user.entity';

export class UpdateAdminUserRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}
