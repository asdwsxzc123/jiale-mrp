# 流水导出功能设计

## 概述

为 Jiale ERP 新增三张独立流水表（入库流水、出库流水、出成率），支持 CRUD 操作和 Excel 导出。导出文件保存到服务器目录，前端通过下载接口获取。定时清理超过 2 天的导出文件。

## 技术选型

- **Excel 生成**: exceljs
- **定时任务**: @nestjs/schedule
- **文件存储**: 服务器本地 `uploads/exports/` 目录

## 数据库模型

### InboundFlow（入库流水）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| date | DateTime | 日期 |
| serialNo | String? | 序号 |
| containerNo | String? | 柜号/车号 |
| itemName | String | 货名 |
| billWeight | Decimal(15,4)? | 提单重量 |
| actualWeight | Decimal(15,4)? | 实际重量 |
| location | String? | 仓库位置 |
| totalWeight | Decimal(15,4)? | 实际总重 |
| remark | String? | 备注 |
| weightDiff | Decimal(15,4)? | 重差 |
| customerId | String? | 关联客户 |
| stockItemId | String? | 关联材料 |

### OutboundFlow（出库流水）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| date | DateTime | 日期 |
| serialNo | String? | 序号 |
| belonging | String? | 归属 |
| containerNo | String? | 柜号 |
| itemName | String | 品名 |
| weight | Decimal(15,4)? | 重量 |
| packageCount | Int? | 包数 |
| totalWeight | Decimal(15,4)? | 总重 |
| remark | String? | 备注 |
| customerId | String? | 关联客户 |
| stockItemId | String? | 关联材料 |

### YieldRate（出成率）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| date | DateTime | 日期 |
| itemName | String | 货名 |
| containerNo | String? | 柜号/车号 |
| incomingWeight | Decimal(15,4)? | 来货重量 |
| step | String? | 步骤 |
| pelletName | String? | 颗粒名称 |
| weight | Decimal(15,4)? | 重量 |
| colorMaster | Decimal(15,4)? | 色母 |
| spaceBag | Decimal(15,4)? | 太空袋 |
| misc | Decimal(15,4)? | 杂料 |
| glueHeadMisc | Decimal(15,4)? | 胶头/杂料 |
| waste | Decimal(15,4)? | 垃圾 |
| pallet | Decimal(15,4)? | 卡板 |
| totalWeight | Decimal(15,4)? | 总重量 |
| yieldRateVal | Decimal(10,4)? | 出成率 |
| remark | String? | 备注 |
| customerId | String? | 关联客户 |
| stockItemId | String? | 关联材料 |

## API 设计

### 通用筛选参数

```
startDate?: string   // 开始日期
endDate?: string     // 结束日期
customerId?: string  // 客户 ID
stockItemId?: string // 材料 ID
page?: number        // 页码
pageSize?: number    // 每页条数
```

### 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/flow/inbound | 新增入库流水 |
| GET | /api/flow/inbound | 查询入库流水 |
| DELETE | /api/flow/inbound/:id | 删除入库流水 |
| POST | /api/flow/inbound/export | 导出入库流水 |
| POST | /api/flow/outbound | 新增出库流水 |
| GET | /api/flow/outbound | 查询出库流水 |
| DELETE | /api/flow/outbound/:id | 删除出库流水 |
| POST | /api/flow/outbound/export | 导出出库流水 |
| POST | /api/flow/yield-rate | 新增出成率 |
| GET | /api/flow/yield-rate | 查询出成率 |
| DELETE | /api/flow/yield-rate/:id | 删除出成率 |
| POST | /api/flow/yield-rate/export | 导出出成率 |
| GET | /api/flow/download/:filename | 下载导出文件 |

## 导出流程

1. 前端调用 `POST /api/flow/xxx/export` + 筛选参数
2. 后端查询数据 → exceljs 生成 xlsx → 保存到 `uploads/exports/`
3. 返回 `{ filename: "inbound_2026-02-15_xxx.xlsx" }`
4. 前端调用 `GET /api/flow/download/:filename` 下载文件

## 定时清理

- Cron 表达式: `0 3 * * *`（每天凌晨 3 点）
- 扫描 `uploads/exports/` 目录
- 删除 mtime 超过 2 天的文件

## 模块结构

```
src/modules/flow/
  flow.module.ts
  flow.controller.ts
  flow.service.ts
  flow-export.service.ts
  flow-cleanup.service.ts
  dto/
    query-flow.dto.ts
    create-inbound.dto.ts
    create-outbound.dto.ts
    create-yield-rate.dto.ts
```
