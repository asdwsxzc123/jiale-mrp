import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service.js';

/** JWT payload 结构 */
interface JwtPayload {
  sub: string;
  username: string;
  role: string;
}

/**
 * JWT 策略 - 从 Bearer token 中解析用户信息
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'jiale-erp-secret-key',
    });
  }

  /** 验证 JWT payload 并返回用户信息 */
  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('用户不存在或已禁用');
    }

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    };
  }
}
