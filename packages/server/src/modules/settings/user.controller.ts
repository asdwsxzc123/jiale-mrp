import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import * as bcrypt from 'bcrypt';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { RolesGuard } from '../../guards/roles.guard.js';
import { Roles } from '../../guards/roles.decorator.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUserDto, UpdateUserDto } from './dto/settings.dto.js';

/**
 * 用户管理控制器 - 仅管理员可访问
 */
@ApiTags('设置-用户管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('settings/users')
export class UserController {
  constructor(private prisma: PrismaService) {}

  /** 查询用户列表 */
  @Get()
  @ApiOperation({ summary: '查询用户列表（仅管理员）' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async findAll(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    const p = page ? parseInt(page) : 1;
    const ps = pageSize ? parseInt(pageSize) : 20;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip: (p - 1) * ps,
        take: ps,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, username: true, name: true,
          role: true, isActive: true, createdAt: true,
        },
      }),
      this.prisma.user.count(),
    ]);
    return { data, total, page: p, pageSize: ps };
  }

  /** 查询用户详情 */
  @Get(':id')
  @ApiOperation({ summary: '查询用户详情' })
  async findOne(@Param('id') id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, username: true, name: true,
        role: true, isActive: true, createdAt: true, updatedAt: true,
      },
    });
  }

  /** 创建用户 */
  @Post()
  @ApiOperation({ summary: '创建用户（仅管理员）' })
  async create(@Body() dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        username: dto.username,
        passwordHash,
        name: dto.name,
        role: (dto.role as any) || 'OPERATOR',
      },
      select: {
        id: true, username: true, name: true,
        role: true, isActive: true, createdAt: true,
      },
    });
  }

  /** 更新用户 */
  @Put(':id')
  @ApiOperation({ summary: '更新用户（仅管理员）' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const data: any = {};
    if (dto.name) data.name = dto.name;
    if (dto.role) data.role = dto.role as any;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true, username: true, name: true,
        role: true, isActive: true, updatedAt: true,
      },
    });
  }

  /** 删除用户（软删除） */
  @Delete(':id')
  @ApiOperation({ summary: '禁用用户（仅管理员）' })
  async remove(@Param('id') id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
