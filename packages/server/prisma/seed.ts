import { PrismaClient, Role, CurrencyCode } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 创建默认管理员用户（密码从环境变量读取，不硬编码）
  const adminPwd = process.env.ADMIN_INIT_PASSWORD;
  if (!adminPwd) {
    throw new Error('ADMIN_INIT_PASSWORD 环境变量未设置，请在 .env 中配置');
  }
  const adminPassword = await bcrypt.hash(adminPwd, 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPassword,
      name: '系统管理员',
      role: Role.ADMIN,
    },
  });

  // 创建货币
  await prisma.currency.upsert({
    where: { code: CurrencyCode.MYR },
    update: {},
    create: { code: CurrencyCode.MYR, name: '马币', symbol: 'RM', exchangeRate: 1, isBase: true },
  });
  await prisma.currency.upsert({
    where: { code: CurrencyCode.RMB },
    update: {},
    create: { code: CurrencyCode.RMB, name: '人民币', symbol: '¥', exchangeRate: 0.48, isBase: false },
  });
  await prisma.currency.upsert({
    where: { code: CurrencyCode.USD },
    update: {},
    create: { code: CurrencyCode.USD, name: '美金', symbol: '$', exchangeRate: 0.21, isBase: false },
  });

  // 创建默认单据编号序列
  const sequences = [
    { type: 'SALES_QUOTATION', prefix: 'QT' },
    { type: 'SALES_ORDER', prefix: 'SO' },
    { type: 'DELIVERY_ORDER', prefix: 'DO' },
    { type: 'SALES_INVOICE', prefix: 'IV' },
    { type: 'CASH_SALE', prefix: 'CS' },
    { type: 'PURCHASE_REQUEST', prefix: 'PQ' },
    { type: 'PURCHASE_ORDER', prefix: 'PO' },
    { type: 'GOODS_RECEIVED', prefix: 'GR' },
    { type: 'PURCHASE_INVOICE', prefix: 'PI' },
    { type: 'JOB_ORDER', prefix: 'JO' },
    { type: 'STOCK_RECEIVED', prefix: 'SR' },
    { type: 'STOCK_ISSUE', prefix: 'SI' },
    { type: 'CUSTOMER_PAYMENT', prefix: 'CP' },
    { type: 'SUPPLIER_PAYMENT', prefix: 'SP' },
  ];

  for (const seq of sequences) {
    await prisma.docNumberSequence.upsert({
      where: { type: seq.type },
      update: {},
      create: { type: seq.type, prefix: seq.prefix, nextNumber: 1, format: '{prefix}-{number:5}' },
    });
  }

  // 创建默认税码
  await prisma.taxCode.upsert({
    where: { code: 'SR' },
    update: {},
    create: { code: 'SR', description: '标准税率', rate: 6 },
  });
  await prisma.taxCode.upsert({
    where: { code: 'ZR' },
    update: {},
    create: { code: 'ZR', description: '零税率', rate: 0 },
  });
  await prisma.taxCode.upsert({
    where: { code: 'ES' },
    update: {},
    create: { code: 'ES', description: '免税', rate: 0 },
  });

  // 创建默认仓库位置
  const locations = ['原料仓', '半成品仓', '成品仓'];
  for (const name of locations) {
    await prisma.stockLocation.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // 创建默认物料组
  await prisma.stockGroup.upsert({
    where: { name: 'DEFAULT' },
    update: {},
    create: { name: 'DEFAULT', description: '默认组' },
  });

  console.log('种子数据创建完成');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
