import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminUserService } from '../../application/admin-user/admin-user.service';
import { User, UserRole } from '../../domain/user/entities/user.entity';
import { JwtAuthGuard } from '../../infrastructure/auth/guards/jwt.guard';
import { Roles } from '../../infrastructure/auth/roles.decorator';
import { ResponseFactory } from '../../shared/http-response/response.factory';
import type {
  PaginatedResponse,
  SuccessResponse,
} from '../../shared/http-response/response.types';
import { PaginationQueryDto } from '../../shared/pagination/pagination-query.dto';
import { CreateAdminUserDto } from './dto/admin-user/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/admin-user/update-admin-user.dto';
import { UpdateAdminUserRoleDto } from './dto/admin-user/update-admin-user-role.dto';

type AuthenticatedRequest = Request & { user?: { sub?: string } };

@Controller('admin/users')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
export class AdminUserController {
  constructor(
    private readonly adminUserService: AdminUserService,
    private readonly responseFactory: ResponseFactory,
  ) {}

  @Get()
  async listUsers(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<Omit<User, 'passwordHash'>>> {
    const users = await this.adminUserService.listUsers(query);
    return this.responseFactory.paginated(users);
  }

  @Post()
  async createUser(
    @Body() body: CreateAdminUserDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.adminUserService.createUser(body);
    return this.responseFactory.resource(user);
  }

  @Patch(':id')
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateAdminUserDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    const updatedUser = await this.adminUserService.updateUser(id, body);
    return this.responseFactory.resource(updatedUser);
  }

  @Patch(':id/role')
  async updateUserRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
    @Body() body: UpdateAdminUserRoleDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    const updatedUser = await this.adminUserService.updateUserRole(
      id,
      body.role,
      request.user?.sub ?? '',
    );
    return this.responseFactory.resource(updatedUser);
  }

  @Delete(':id')
  async deleteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<SuccessResponse> {
    await this.adminUserService.deleteUser(id, request.user?.sub ?? '');
    return this.responseFactory.success(true);
  }
}
