/**
 * 检查数据库是否已初始化（users 表是否有数据）
 * 输出 "yes" 表示需要 seed，"no" 表示已初始化
 */
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  try {
    const count = await prisma.user.count();
    console.log(count === 0 ? 'yes' : 'no');
  } catch {
    // 表不存在等异常，视为需要 seed
    console.log('yes');
  } finally {
    await prisma.$disconnect();
  }
}
main();
