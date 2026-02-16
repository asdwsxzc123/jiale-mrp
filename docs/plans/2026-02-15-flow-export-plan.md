# 流水导出功能 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 新增入库流水、出库流水、出成率三张独立表的 CRUD + Excel 导出功能，含定时清理导出文件。

**Architecture:** 新建 flow 模块，包含 3 个 Prisma 模型 + CRUD 服务 + exceljs 导出 + @nestjs/schedule 定时清理。文件存服务器 `uploads/exports/`，前端通过下载接口获取。

**Tech Stack:** NestJS 11, Prisma 7.4, exceljs, @nestjs/schedule

---

### Task 1: 安装依赖

**Files:**
- Modify: `packages/server/package.json`

**Step 1: 安装 exceljs 和 @nestjs/schedule**

```bash
cd /Users/mac/git/person/jiale_erp/packages/server
pnpm add exceljs @nestjs/schedule
```

**Step 2: 验证安装成功**

```bash
cd /Users/mac/git/person/jiale_erp/packages/server
node -e "require('exceljs'); require('@nestjs/schedule'); console.log('OK')"
```

Expected: `OK`

**Step 3: Commit**

```bash
git add packages/server/package.json packages/server/pnpm-lock.yaml
git commit -m "feat: 安装 exceljs 和 @nestjs/schedule 依赖"
```

---

### Task 2: 新增 Prisma 模型

**Files:**
- Modify: `packages/server/prisma/schema.prisma` (末尾追加)

**Step 1: 在 schema.prisma 末尾追加三个模型**

在 `DocNumberSequence` 模型之后追加：

```prisma
// ==================== 流水记录 ====================

model InboundFlow {
  id           String   @id @default(uuid())
  date         DateTime @db.Date                          // 日期
  serialNo     String?  @map("serial_no")                 // 序号
  containerNo  String?  @map("container_no")              // 柜号/车号
  itemName     String   @map("item_name")                 // 货名
  billWeight   Decimal? @map("bill_weight") @db.Decimal(15, 4)  // 提单重量
  actualWeight Decimal? @map("actual_weight") @db.Decimal(15, 4) // 实际重量
  location     String?                                    // 仓库位置
  totalWeight  Decimal? @map("total_weight") @db.Decimal(15, 4)  // 实际总重
  remark       String?                                    // 备注
  weightDiff   Decimal? @map("weight_diff") @db.Decimal(15, 4)   // 重差
  customerId   String?  @map("customer_id")               // 关联客户
  stockItemId  String?  @map("stock_item_id")             // 关联材料
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  customer  Customer?  @relation(fields: [customerId], references: [id])
  stockItem StockItem? @relation("InboundFlowItem", fields: [stockItemId], references: [id])

  @@map("inbound_flows")
}

model OutboundFlow {
  id           String   @id @default(uuid())
  date         DateTime @db.Date                          // 日期
  serialNo     String?  @map("serial_no")                 // 序号
  belonging    String?                                    // 归属
  containerNo  String?  @map("container_no")              // 柜号
  itemName     String   @map("item_name")                 // 品名
  weight       Decimal? @db.Decimal(15, 4)                // 重量
  packageCount Int?     @map("package_count")             // 包数
  totalWeight  Decimal? @map("total_weight") @db.Decimal(15, 4)  // 总重
  remark       String?                                    // 备注
  customerId   String?  @map("customer_id")               // 关联客户
  stockItemId  String?  @map("stock_item_id")             // 关联材料
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  customer  Customer?  @relation(fields: [customerId], references: [id])
  stockItem StockItem? @relation("OutboundFlowItem", fields: [stockItemId], references: [id])

  @@map("outbound_flows")
}

model YieldRate {
  id              String   @id @default(uuid())
  date            DateTime @db.Date                               // 日期
  itemName        String   @map("item_name")                      // 货名
  containerNo     String?  @map("container_no")                   // 柜号/车号
  incomingWeight  Decimal? @map("incoming_weight") @db.Decimal(15, 4) // 来货重量
  step            String?                                         // 步骤
  pelletName      String?  @map("pellet_name")                    // 颗粒名称
  weight          Decimal? @db.Decimal(15, 4)                     // 重量
  colorMaster     Decimal? @map("color_master") @db.Decimal(15, 4)    // 色母
  spaceBag        Decimal? @map("space_bag") @db.Decimal(15, 4)      // 太空袋
  misc            Decimal? @db.Decimal(15, 4)                     // 杂料
  glueHeadMisc    Decimal? @map("glue_head_misc") @db.Decimal(15, 4) // 胶头/杂料
  waste           Decimal? @db.Decimal(15, 4)                     // 垃圾
  pallet          Decimal? @db.Decimal(15, 4)                     // 卡板
  totalWeight     Decimal? @map("total_weight") @db.Decimal(15, 4)   // 总重量
  yieldRateVal    Decimal? @map("yield_rate_val") @db.Decimal(10, 4) // 出成率
  remark          String?                                         // 备注
  customerId      String?  @map("customer_id")                    // 关联客户
  stockItemId     String?  @map("stock_item_id")                  // 关联材料
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  customer  Customer?  @relation(fields: [customerId], references: [id])
  stockItem StockItem? @relation("YieldRateItem", fields: [stockItemId], references: [id])

  @@map("yield_rates")
}
```

**Step 2: 在 Customer 模型中追加反向关系**

在 `Customer` 模型的 `refunds` 行之后追加：

```prisma
  inboundFlows    InboundFlow[]
  outboundFlows   OutboundFlow[]
  yieldRates      YieldRate[]
```

**Step 3: 在 StockItem 模型中追加反向关系**

在 `StockItem` 模型的 `finishedProducts` 行之后追加：

```prisma
  inboundFlows    InboundFlow[]  @relation("InboundFlowItem")
  outboundFlows   OutboundFlow[] @relation("OutboundFlowItem")
  yieldRates      YieldRate[]    @relation("YieldRateItem")
```

**Step 4: 推送到数据库**

```bash
cd /Users/mac/git/person/jiale_erp/packages/server
npx prisma db push
```

Expected: 输出包含 `Your database is now in sync with your Prisma schema`

**Step 5: Commit**

```bash
git add packages/server/prisma/schema.prisma
git commit -m "feat: 新增入库流水/出库流水/出成率三个 Prisma 模型"
```

---

### Task 3: 创建 DTO 文件

**Files:**
- Create: `packages/server/src/modules/flow/dto/query-flow.dto.ts`
- Create: `packages/server/src/modules/flow/dto/create-inbound.dto.ts`
- Create: `packages/server/src/modules/flow/dto/create-outbound.dto.ts`
- Create: `packages/server/src/modules/flow/dto/create-yield-rate.dto.ts`

**Step 1: 创建通用查询 DTO**

`packages/server/src/modules/flow/dto/query-flow.dto.ts`:

```typescript
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 流水通用查询 DTO - 三表共用的筛选条件
 */
export class QueryFlowDto {
  @ApiPropertyOptional({ description: '开始日期，格式 YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期，格式 YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: '客户 ID' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ description: '材料 ID' })
  @IsOptional()
  @IsString()
  stockItemId?: string;

  @ApiPropertyOptional({ description: '页码', default: '1' })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ description: '每页条数', default: '20' })
  @IsOptional()
  @IsString()
  pageSize?: string;
}
```

**Step 2: 创建入库流水 DTO**

`packages/server/src/modules/flow/dto/create-inbound.dto.ts`:

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 创建入库流水 DTO
 */
export class CreateInboundDto {
  @ApiProperty({ description: '日期，格式 YYYY-MM-DD' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ description: '序号' })
  @IsOptional() @IsString() serialNo?: string;

  @ApiPropertyOptional({ description: '柜号/车号' })
  @IsOptional() @IsString() containerNo?: string;

  @ApiProperty({ description: '货名' })
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @ApiPropertyOptional({ description: '提单重量' })
  @IsOptional() @IsNumber() billWeight?: number;

  @ApiPropertyOptional({ description: '实际重量' })
  @IsOptional() @IsNumber() actualWeight?: number;

  @ApiPropertyOptional({ description: '仓库位置' })
  @IsOptional() @IsString() location?: string;

  @ApiPropertyOptional({ description: '实际总重' })
  @IsOptional() @IsNumber() totalWeight?: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional() @IsString() remark?: string;

  @ApiPropertyOptional({ description: '重差' })
  @IsOptional() @IsNumber() weightDiff?: number;

  @ApiPropertyOptional({ description: '客户 ID' })
  @IsOptional() @IsString() customerId?: string;

  @ApiPropertyOptional({ description: '材料 ID' })
  @IsOptional() @IsString() stockItemId?: string;
}
```

**Step 3: 创建出库流水 DTO**

`packages/server/src/modules/flow/dto/create-outbound.dto.ts`:

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 创建出库流水 DTO
 */
export class CreateOutboundDto {
  @ApiProperty({ description: '日期，格式 YYYY-MM-DD' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ description: '序号' })
  @IsOptional() @IsString() serialNo?: string;

  @ApiPropertyOptional({ description: '归属' })
  @IsOptional() @IsString() belonging?: string;

  @ApiPropertyOptional({ description: '柜号' })
  @IsOptional() @IsString() containerNo?: string;

  @ApiProperty({ description: '品名' })
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @ApiPropertyOptional({ description: '重量' })
  @IsOptional() @IsNumber() weight?: number;

  @ApiPropertyOptional({ description: '包数' })
  @IsOptional() @IsInt() packageCount?: number;

  @ApiPropertyOptional({ description: '总重' })
  @IsOptional() @IsNumber() totalWeight?: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional() @IsString() remark?: string;

  @ApiPropertyOptional({ description: '客户 ID' })
  @IsOptional() @IsString() customerId?: string;

  @ApiPropertyOptional({ description: '材料 ID' })
  @IsOptional() @IsString() stockItemId?: string;
}
```

**Step 4: 创建出成率 DTO**

`packages/server/src/modules/flow/dto/create-yield-rate.dto.ts`:

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 创建出成率 DTO
 */
export class CreateYieldRateDto {
  @ApiProperty({ description: '日期，格式 YYYY-MM-DD' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ description: '货名' })
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @ApiPropertyOptional({ description: '柜号/车号' })
  @IsOptional() @IsString() containerNo?: string;

  @ApiPropertyOptional({ description: '来货重量' })
  @IsOptional() @IsNumber() incomingWeight?: number;

  @ApiPropertyOptional({ description: '步骤' })
  @IsOptional() @IsString() step?: string;

  @ApiPropertyOptional({ description: '颗粒名称' })
  @IsOptional() @IsString() pelletName?: string;

  @ApiPropertyOptional({ description: '重量' })
  @IsOptional() @IsNumber() weight?: number;

  @ApiPropertyOptional({ description: '色母' })
  @IsOptional() @IsNumber() colorMaster?: number;

  @ApiPropertyOptional({ description: '太空袋' })
  @IsOptional() @IsNumber() spaceBag?: number;

  @ApiPropertyOptional({ description: '杂料' })
  @IsOptional() @IsNumber() misc?: number;

  @ApiPropertyOptional({ description: '胶头/杂料' })
  @IsOptional() @IsNumber() glueHeadMisc?: number;

  @ApiPropertyOptional({ description: '垃圾' })
  @IsOptional() @IsNumber() waste?: number;

  @ApiPropertyOptional({ description: '卡板' })
  @IsOptional() @IsNumber() pallet?: number;

  @ApiPropertyOptional({ description: '总重量' })
  @IsOptional() @IsNumber() totalWeight?: number;

  @ApiPropertyOptional({ description: '出成率' })
  @IsOptional() @IsNumber() yieldRateVal?: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional() @IsString() remark?: string;

  @ApiPropertyOptional({ description: '客户 ID' })
  @IsOptional() @IsString() customerId?: string;

  @ApiPropertyOptional({ description: '材料 ID' })
  @IsOptional() @IsString() stockItemId?: string;
}
```

**Step 5: Commit**

```bash
git add packages/server/src/modules/flow/dto/
git commit -m "feat: 创建流水模块 DTO（查询/入库/出库/出成率）"
```

---

### Task 4: 创建流水 CRUD 服务

**Files:**
- Create: `packages/server/src/modules/flow/flow.service.ts`

**Step 1: 创建 flow.service.ts**

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateInboundDto } from './dto/create-inbound.dto.js';
import { CreateOutboundDto } from './dto/create-outbound.dto.js';
import { CreateYieldRateDto } from './dto/create-yield-rate.dto.js';

/**
 * 流水服务 - 入库流水/出库流水/出成率的 CRUD 操作
 */
@Injectable()
export class FlowService {
  constructor(private prisma: PrismaService) {}

  // ==================== 通用筛选条件构建 ====================

  /**
   * 构建通用的 where 条件（时间区间 + 客户 + 材料）
   */
  private buildWhere(query: {
    startDate?: string;
    endDate?: string;
    customerId?: string;
    stockItemId?: string;
  }) {
    const where: any = {};
    // 时间区间筛选
    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }
    // 客户筛选
    if (query.customerId) where.customerId = query.customerId;
    // 材料筛选
    if (query.stockItemId) where.stockItemId = query.stockItemId;
    return where;
  }

  // ==================== 入库流水 ====================

  /** 查询入库流水列表（分页+筛选） */
  async findAllInbound(query: {
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
    customerId?: string;
    stockItemId?: string;
  }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const where = this.buildWhere(query);

    const [data, total] = await Promise.all([
      this.prisma.inboundFlow.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { date: 'desc' },
        include: { customer: true, stockItem: true },
      }),
      this.prisma.inboundFlow.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }

  /** 查询全部入库流水（导出用，不分页） */
  async findAllInboundForExport(query: {
    startDate?: string;
    endDate?: string;
    customerId?: string;
    stockItemId?: string;
  }) {
    const where = this.buildWhere(query);
    return this.prisma.inboundFlow.findMany({
      where,
      orderBy: { date: 'asc' },
      include: { customer: true, stockItem: true },
    });
  }

  /** 创建入库流水 */
  async createInbound(dto: CreateInboundDto) {
    return this.prisma.inboundFlow.create({
      data: { ...dto, date: new Date(dto.date) },
      include: { customer: true, stockItem: true },
    });
  }

  /** 删除入库流水 */
  async removeInbound(id: string) {
    const record = await this.prisma.inboundFlow.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('入库流水记录不存在');
    return this.prisma.inboundFlow.delete({ where: { id } });
  }

  // ==================== 出库流水 ====================

  /** 查询出库流水列表（分页+筛选） */
  async findAllOutbound(query: {
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
    customerId?: string;
    stockItemId?: string;
  }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const where = this.buildWhere(query);

    const [data, total] = await Promise.all([
      this.prisma.outboundFlow.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { date: 'desc' },
        include: { customer: true, stockItem: true },
      }),
      this.prisma.outboundFlow.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }

  /** 查询全部出库流水（导出用，不分页） */
  async findAllOutboundForExport(query: {
    startDate?: string;
    endDate?: string;
    customerId?: string;
    stockItemId?: string;
  }) {
    const where = this.buildWhere(query);
    return this.prisma.outboundFlow.findMany({
      where,
      orderBy: { date: 'asc' },
      include: { customer: true, stockItem: true },
    });
  }

  /** 创建出库流水 */
  async createOutbound(dto: CreateOutboundDto) {
    return this.prisma.outboundFlow.create({
      data: { ...dto, date: new Date(dto.date) },
      include: { customer: true, stockItem: true },
    });
  }

  /** 删除出库流水 */
  async removeOutbound(id: string) {
    const record = await this.prisma.outboundFlow.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('出库流水记录不存在');
    return this.prisma.outboundFlow.delete({ where: { id } });
  }

  // ==================== 出成率 ====================

  /** 查询出成率列表（分页+筛选） */
  async findAllYieldRate(query: {
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
    customerId?: string;
    stockItemId?: string;
  }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const where = this.buildWhere(query);

    const [data, total] = await Promise.all([
      this.prisma.yieldRate.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { date: 'desc' },
        include: { customer: true, stockItem: true },
      }),
      this.prisma.yieldRate.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }

  /** 查询全部出成率（导出用，不分页） */
  async findAllYieldRateForExport(query: {
    startDate?: string;
    endDate?: string;
    customerId?: string;
    stockItemId?: string;
  }) {
    const where = this.buildWhere(query);
    return this.prisma.yieldRate.findMany({
      where,
      orderBy: { date: 'asc' },
      include: { customer: true, stockItem: true },
    });
  }

  /** 创建出成率记录 */
  async createYieldRate(dto: CreateYieldRateDto) {
    return this.prisma.yieldRate.create({
      data: { ...dto, date: new Date(dto.date) },
      include: { customer: true, stockItem: true },
    });
  }

  /** 删除出成率记录 */
  async removeYieldRate(id: string) {
    const record = await this.prisma.yieldRate.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('出成率记录不存在');
    return this.prisma.yieldRate.delete({ where: { id } });
  }
}
```

**Step 2: Commit**

```bash
git add packages/server/src/modules/flow/flow.service.ts
git commit -m "feat: 创建流水 CRUD 服务（入库/出库/出成率）"
```

---

### Task 5: 创建 Excel 导出服务

**Files:**
- Create: `packages/server/src/modules/flow/flow-export.service.ts`

**Step 1: 创建 flow-export.service.ts**

```typescript
import { Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// 导出文件存储目录（相对于项目根目录）
const EXPORT_DIR = join(process.cwd(), 'uploads', 'exports');

/**
 * 流水导出服务 - 使用 exceljs 生成 xlsx 文件
 */
@Injectable()
export class FlowExportService {
  constructor() {
    // 确保导出目录存在
    if (!existsSync(EXPORT_DIR)) {
      mkdirSync(EXPORT_DIR, { recursive: true });
    }
  }

  /** 获取导出文件的绝对路径 */
  getFilePath(filename: string): string {
    return join(EXPORT_DIR, filename);
  }

  /**
   * 导出入库流水为 xlsx
   * @param data 入库流水数据列表
   * @returns 生成的文件名
   */
  async exportInbound(data: any[]): Promise<string> {
    const wb = new Workbook();
    const ws = wb.addWorksheet('入库流水');

    // 设置表头
    ws.columns = [
      { header: '日期', key: 'date', width: 14 },
      { header: '序号', key: 'serialNo', width: 12 },
      { header: '柜号/车号', key: 'containerNo', width: 20 },
      { header: '货名', key: 'itemName', width: 18 },
      { header: '提单重量', key: 'billWeight', width: 12 },
      { header: '实际重量', key: 'actualWeight', width: 12 },
      { header: '仓库位置', key: 'location', width: 12 },
      { header: '实际总重', key: 'totalWeight', width: 12 },
      { header: '备注', key: 'remark', width: 30 },
      { header: '重差', key: 'weightDiff', width: 12 },
    ];

    // 表头加粗
    ws.getRow(1).font = { bold: true };

    // 填充数据
    for (const row of data) {
      ws.addRow({
        date: row.date ? new Date(row.date).toISOString().split('T')[0] : '',
        serialNo: row.serialNo ?? '',
        containerNo: row.containerNo ?? '',
        itemName: row.itemName ?? '',
        billWeight: row.billWeight ? Number(row.billWeight) : '',
        actualWeight: row.actualWeight ? Number(row.actualWeight) : '',
        location: row.location ?? '',
        totalWeight: row.totalWeight ? Number(row.totalWeight) : '',
        remark: row.remark ?? '',
        weightDiff: row.weightDiff ? Number(row.weightDiff) : '',
      });
    }

    // 生成文件名（时间戳防重复）
    const filename = `inbound_${Date.now()}.xlsx`;
    await wb.xlsx.writeFile(this.getFilePath(filename));
    return filename;
  }

  /**
   * 导出出库流水为 xlsx
   * @param data 出库流水数据列表
   * @returns 生成的文件名
   */
  async exportOutbound(data: any[]): Promise<string> {
    const wb = new Workbook();
    const ws = wb.addWorksheet('出库流水');

    ws.columns = [
      { header: '日期', key: 'date', width: 14 },
      { header: '序号', key: 'serialNo', width: 12 },
      { header: '归属', key: 'belonging', width: 14 },
      { header: '柜号', key: 'containerNo', width: 20 },
      { header: '品名', key: 'itemName', width: 18 },
      { header: '重量', key: 'weight', width: 12 },
      { header: '包数', key: 'packageCount', width: 10 },
      { header: '总重', key: 'totalWeight', width: 12 },
      { header: '备注', key: 'remark', width: 30 },
    ];

    ws.getRow(1).font = { bold: true };

    for (const row of data) {
      ws.addRow({
        date: row.date ? new Date(row.date).toISOString().split('T')[0] : '',
        serialNo: row.serialNo ?? '',
        belonging: row.belonging ?? '',
        containerNo: row.containerNo ?? '',
        itemName: row.itemName ?? '',
        weight: row.weight ? Number(row.weight) : '',
        packageCount: row.packageCount ?? '',
        totalWeight: row.totalWeight ? Number(row.totalWeight) : '',
        remark: row.remark ?? '',
      });
    }

    const filename = `outbound_${Date.now()}.xlsx`;
    await wb.xlsx.writeFile(this.getFilePath(filename));
    return filename;
  }

  /**
   * 导出出成率为 xlsx
   * @param data 出成率数据列表
   * @returns 生成的文件名
   */
  async exportYieldRate(data: any[]): Promise<string> {
    const wb = new Workbook();
    const ws = wb.addWorksheet('出成率');

    ws.columns = [
      { header: '日期', key: 'date', width: 14 },
      { header: '货名', key: 'itemName', width: 18 },
      { header: '柜号/车号', key: 'containerNo', width: 20 },
      { header: '来货重量', key: 'incomingWeight', width: 12 },
      { header: '步骤', key: 'step', width: 14 },
      { header: '颗粒名称', key: 'pelletName', width: 14 },
      { header: '重量', key: 'weight', width: 12 },
      { header: '色母', key: 'colorMaster', width: 10 },
      { header: '太空袋', key: 'spaceBag', width: 10 },
      { header: '杂料', key: 'misc', width: 10 },
      { header: '胶头/杂料', key: 'glueHeadMisc', width: 12 },
      { header: '垃圾', key: 'waste', width: 10 },
      { header: '卡板', key: 'pallet', width: 10 },
      { header: '总重量', key: 'totalWeight', width: 12 },
      { header: '出成率', key: 'yieldRateVal', width: 10 },
      { header: '备注', key: 'remark', width: 30 },
    ];

    ws.getRow(1).font = { bold: true };

    for (const row of data) {
      ws.addRow({
        date: row.date ? new Date(row.date).toISOString().split('T')[0] : '',
        itemName: row.itemName ?? '',
        containerNo: row.containerNo ?? '',
        incomingWeight: row.incomingWeight ? Number(row.incomingWeight) : '',
        step: row.step ?? '',
        pelletName: row.pelletName ?? '',
        weight: row.weight ? Number(row.weight) : '',
        colorMaster: row.colorMaster ? Number(row.colorMaster) : '',
        spaceBag: row.spaceBag ? Number(row.spaceBag) : '',
        misc: row.misc ? Number(row.misc) : '',
        glueHeadMisc: row.glueHeadMisc ? Number(row.glueHeadMisc) : '',
        waste: row.waste ? Number(row.waste) : '',
        pallet: row.pallet ? Number(row.pallet) : '',
        totalWeight: row.totalWeight ? Number(row.totalWeight) : '',
        yieldRateVal: row.yieldRateVal ? Number(row.yieldRateVal) : '',
        remark: row.remark ?? '',
      });
    }

    const filename = `yield_rate_${Date.now()}.xlsx`;
    await wb.xlsx.writeFile(this.getFilePath(filename));
    return filename;
  }
}
```

**Step 2: Commit**

```bash
git add packages/server/src/modules/flow/flow-export.service.ts
git commit -m "feat: 创建 Excel 导出服务（入库/出库/出成率）"
```

---

### Task 6: 创建定时清理服务

**Files:**
- Create: `packages/server/src/modules/flow/flow-cleanup.service.ts`

**Step 1: 创建 flow-cleanup.service.ts**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { join } from 'path';
import { readdirSync, statSync, unlinkSync, existsSync } from 'fs';

// 导出文件存储目录
const EXPORT_DIR = join(process.cwd(), 'uploads', 'exports');
// 文件保留时长：2 天（毫秒）
const MAX_AGE_MS = 2 * 24 * 60 * 60 * 1000;

/**
 * 导出文件定时清理服务
 * 每天凌晨 3 点扫描 uploads/exports/，删除超过 2 天的文件
 */
@Injectable()
export class FlowCleanupService {
  private readonly logger = new Logger(FlowCleanupService.name);

  @Cron('0 3 * * *')
  handleCleanup() {
    if (!existsSync(EXPORT_DIR)) return;

    const now = Date.now();
    const files = readdirSync(EXPORT_DIR);
    let deletedCount = 0;

    for (const file of files) {
      const filePath = join(EXPORT_DIR, file);
      try {
        const stat = statSync(filePath);
        // 如果文件修改时间超过 2 天，删除
        if (now - stat.mtimeMs > MAX_AGE_MS) {
          unlinkSync(filePath);
          deletedCount++;
        }
      } catch (err) {
        this.logger.warn(`清理文件失败: ${filePath}`, err);
      }
    }

    if (deletedCount > 0) {
      this.logger.log(`定时清理完成，删除了 ${deletedCount} 个过期导出文件`);
    }
  }
}
```

**Step 2: Commit**

```bash
git add packages/server/src/modules/flow/flow-cleanup.service.ts
git commit -m "feat: 创建导出文件定时清理服务（每天凌晨 3 点，保留 2 天）"
```

---

### Task 7: 创建控制器

**Files:**
- Create: `packages/server/src/modules/flow/flow.controller.ts`

**Step 1: 创建 flow.controller.ts**

```typescript
import {
  Controller, Get, Post, Delete,
  Body, Param, Query, Res, UseGuards, NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { FlowService } from './flow.service.js';
import { FlowExportService } from './flow-export.service.js';
import { CreateInboundDto } from './dto/create-inbound.dto.js';
import { CreateOutboundDto } from './dto/create-outbound.dto.js';
import { CreateYieldRateDto } from './dto/create-yield-rate.dto.js';
import { QueryFlowDto } from './dto/query-flow.dto.js';
import { existsSync } from 'fs';

/**
 * 流水控制器 - 入库流水/出库流水/出成率的接口
 */
@ApiTags('流水管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('flow')
export class FlowController {
  constructor(
    private readonly flowService: FlowService,
    private readonly flowExportService: FlowExportService,
  ) {}

  // ==================== 入库流水 ====================

  /** 查询入库流水列表 */
  @Get('inbound')
  @ApiOperation({ summary: '查询入库流水列表（分页+筛选）' })
  async findAllInbound(@Query() query: QueryFlowDto) {
    return this.flowService.findAllInbound({
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 20,
      startDate: query.startDate,
      endDate: query.endDate,
      customerId: query.customerId,
      stockItemId: query.stockItemId,
    });
  }

  /** 新增入库流水 */
  @Post('inbound')
  @ApiOperation({ summary: '新增入库流水' })
  async createInbound(@Body() dto: CreateInboundDto) {
    return this.flowService.createInbound(dto);
  }

  /** 删除入库流水 */
  @Delete('inbound/:id')
  @ApiOperation({ summary: '删除入库流水' })
  async removeInbound(@Param('id') id: string) {
    return this.flowService.removeInbound(id);
  }

  /** 导出入库流水 xlsx */
  @Post('inbound/export')
  @ApiOperation({ summary: '导出入库流水为 Excel' })
  async exportInbound(@Body() query: QueryFlowDto) {
    const data = await this.flowService.findAllInboundForExport({
      startDate: query.startDate,
      endDate: query.endDate,
      customerId: query.customerId,
      stockItemId: query.stockItemId,
    });
    const filename = await this.flowExportService.exportInbound(data);
    return { filename };
  }

  // ==================== 出库流水 ====================

  /** 查询出库流水列表 */
  @Get('outbound')
  @ApiOperation({ summary: '查询出库流水列表（分页+筛选）' })
  async findAllOutbound(@Query() query: QueryFlowDto) {
    return this.flowService.findAllOutbound({
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 20,
      startDate: query.startDate,
      endDate: query.endDate,
      customerId: query.customerId,
      stockItemId: query.stockItemId,
    });
  }

  /** 新增出库流水 */
  @Post('outbound')
  @ApiOperation({ summary: '新增出库流水' })
  async createOutbound(@Body() dto: CreateOutboundDto) {
    return this.flowService.createOutbound(dto);
  }

  /** 删除出库流水 */
  @Delete('outbound/:id')
  @ApiOperation({ summary: '删除出库流水' })
  async removeOutbound(@Param('id') id: string) {
    return this.flowService.removeOutbound(id);
  }

  /** 导出出库流水 xlsx */
  @Post('outbound/export')
  @ApiOperation({ summary: '导出出库流水为 Excel' })
  async exportOutbound(@Body() query: QueryFlowDto) {
    const data = await this.flowService.findAllOutboundForExport({
      startDate: query.startDate,
      endDate: query.endDate,
      customerId: query.customerId,
      stockItemId: query.stockItemId,
    });
    const filename = await this.flowExportService.exportOutbound(data);
    return { filename };
  }

  // ==================== 出成率 ====================

  /** 查询出成率列表 */
  @Get('yield-rate')
  @ApiOperation({ summary: '查询出成率列表（分页+筛选）' })
  async findAllYieldRate(@Query() query: QueryFlowDto) {
    return this.flowService.findAllYieldRate({
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 20,
      startDate: query.startDate,
      endDate: query.endDate,
      customerId: query.customerId,
      stockItemId: query.stockItemId,
    });
  }

  /** 新增出成率 */
  @Post('yield-rate')
  @ApiOperation({ summary: '新增出成率记录' })
  async createYieldRate(@Body() dto: CreateYieldRateDto) {
    return this.flowService.createYieldRate(dto);
  }

  /** 删除出成率 */
  @Delete('yield-rate/:id')
  @ApiOperation({ summary: '删除出成率记录' })
  async removeYieldRate(@Param('id') id: string) {
    return this.flowService.removeYieldRate(id);
  }

  /** 导出出成率 xlsx */
  @Post('yield-rate/export')
  @ApiOperation({ summary: '导出出成率为 Excel' })
  async exportYieldRate(@Body() query: QueryFlowDto) {
    const data = await this.flowService.findAllYieldRateForExport({
      startDate: query.startDate,
      endDate: query.endDate,
      customerId: query.customerId,
      stockItemId: query.stockItemId,
    });
    const filename = await this.flowExportService.exportYieldRate(data);
    return { filename };
  }

  // ==================== 文件下载 ====================

  /** 下载导出文件 */
  @Get('download/:filename')
  @ApiOperation({ summary: '下载导出的 Excel 文件' })
  async download(@Param('filename') filename: string, @Res() res: Response) {
    // 安全校验：只允许 .xlsx 文件名，防止路径穿越
    if (!/^[\w\-]+\.xlsx$/.test(filename)) {
      throw new NotFoundException('文件不存在');
    }
    const filePath = this.flowExportService.getFilePath(filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException('文件不存在或已过期');
    }
    res.download(filePath, filename);
  }
}
```

**Step 2: Commit**

```bash
git add packages/server/src/modules/flow/flow.controller.ts
git commit -m "feat: 创建流水控制器（CRUD + 导出 + 下载）"
```

---

### Task 8: 创建模块并注册到 AppModule

**Files:**
- Create: `packages/server/src/modules/flow/flow.module.ts`
- Modify: `packages/server/src/app.module.ts`

**Step 1: 创建 flow.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { FlowController } from './flow.controller.js';
import { FlowService } from './flow.service.js';
import { FlowExportService } from './flow-export.service.js';
import { FlowCleanupService } from './flow-cleanup.service.js';

/**
 * 流水模块 - 入库流水/出库流水/出成率管理 + Excel 导出 + 定时清理
 */
@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [FlowController],
  providers: [FlowService, FlowExportService, FlowCleanupService],
})
export class FlowModule {}
```

**Step 2: 在 app.module.ts 中注册 FlowModule**

在 `import` 区块追加：
```typescript
import { FlowModule } from './modules/flow/flow.module.js';
```

在 `@Module.imports` 数组的 `SettingsModule` 之后追加：
```typescript
FlowModule,       // 流水管理 + 导出
```

**Step 3: Commit**

```bash
git add packages/server/src/modules/flow/flow.module.ts packages/server/src/app.module.ts
git commit -m "feat: 注册流水模块到 AppModule"
```

---

### Task 9: 验证构建与运行

**Step 1: 构建项目**

```bash
cd /Users/mac/git/person/jiale_erp/packages/server
pnpm run build
```

Expected: 构建成功，无报错

**Step 2: 启动开发服务器**

```bash
cd /Users/mac/git/person/jiale_erp/packages/server
pnpm run dev
```

Expected: 服务启动成功，输出 `Server running on http://localhost:3100`

**Step 3: 访问 Swagger 文档验证接口注册**

浏览器打开 `http://localhost:3100/api/docs`，确认「流水管理」标签下有所有接口。

**Step 4: Commit（如有修复）**

```bash
git add -A
git commit -m "fix: 修复流水模块构建问题"
```
