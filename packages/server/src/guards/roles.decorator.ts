import { SetMetadata } from '@nestjs/common';

/** 角色元数据 key */
export const ROLES_KEY = 'roles';

/**
 * 角色装饰器 - 用于标注接口所需的角色权限
 * @param roles 允许访问的角色列表
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
