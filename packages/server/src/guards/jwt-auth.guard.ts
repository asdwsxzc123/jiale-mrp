import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT 认证守卫 - 验证请求中的 JWT token
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
