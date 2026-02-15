import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Prisma 服务 - 使用 adapter-pg 连接 PostgreSQL，模块初始化时自动连接数据库
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
