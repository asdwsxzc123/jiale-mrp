# Jiale ERP - MRP 系统设计文档

> 日期: 2026-02-14
> 状态: 已批准
> 公司: QIN YE MANUFACTURING SDN BHD

---

## 一、项目概述

### 1.1 目标

构建一套 MRP（物料需求计划）系统，覆盖采购、库存、生产、销售全链路，
替代现有 SQL Account ERP，支持原材料到成品的全程溯源。

### 1.2 核心业务场景

- 单公司使用（QIN YE MANUFACTURING SDN BHD）
- 纯中文界面
- 三种货币：MYR（马币）、RMB（人民币）、USD（美金）
- 以重量为主要计量方式（KG/TON）
- 需要原材料→成品的全链路 QR 码溯源

---

## 二、技术架构

### 2.1 技术栈

| 层面     | 选型                              |
| -------- | --------------------------------- |
| 前端     | React 18 + Ant Design Pro         |
| 后端     | NestJS + Prisma ORM + TypeScript  |
| 数据库   | PostgreSQL 16                     |
| 部署     | Docker Compose                    |
| 容器组成 | Nginx(前端) + Node(后端) + PostgreSQL |

### 2.2 项目结构（Monorepo）

```
jiale_erp/
├── docker-compose.yml
├── packages/
│   ├── web/                        # React 前端
│   │   ├── src/
│   │   │   ├── pages/              # 按模块拆分页面
│   │   │   │   ├── auth/           # 登录
│   │   │   │   ├── customer/       # 客户管理
│   │   │   │   ├── supplier/       # 供应商管理
│   │   │   │   ├── stock/          # 库存管理
│   │   │   │   ├── purchase/       # 采购管理
│   │   │   │   ├── sales/          # 销售管理
│   │   │   │   ├── production/     # 生产管理
│   │   │   │   ├── inspection/     # 来料检验
│   │   │   │   ├── trace/          # 溯源查询
│   │   │   │   └── settings/       # 系统设置
│   │   │   ├── services/           # API 调用层
│   │   │   ├── stores/             # 状态管理
│   │   │   └── components/         # 通用组件
│   │   └── package.json
│   └── server/                     # NestJS 后端
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/           # 认证与权限
│       │   │   ├── customer/       # 客户
│       │   │   ├── supplier/       # 供应商
│       │   │   ├── stock/          # 库存
│       │   │   ├── purchase/       # 采购
│       │   │   ├── sales/          # 销售
│       │   │   ├── production/     # 生产
│       │   │   ├── inspection/     # 来料检验
│       │   │   ├── trace/          # 溯源
│       │   │   └── common/         # 货币、税率、编号序列
│       │   ├── prisma/             # Schema + 迁移
│       │   └── guards/             # 权限守卫
│       └── package.json
└── docs/plans/
```

---

## 三、用户与权限

### 3.1 角色定义

| 角色     | 权限                                         |
| -------- | -------------------------------------------- |
| ADMIN    | 全部权限，含系统设置、用户管理                 |
| MANAGER  | 增删改查所有业务数据，审批单据                 |
| OPERATOR | 新增、编辑、查看，不能删除，不能审批           |
| VIEWER   | 只读，只能查看                                |

### 3.2 用户模型

| 字段          | 类型    | 说明           |
| ------------- | ------- | -------------- |
| id            | UUID    | 主键           |
| username      | String  | 登录账号       |
| password_hash | String  | 密码哈希       |
| name          | String  | 显示名称       |
| role          | Enum    | 角色           |
| is_active     | Boolean | 是否启用       |
| created_at    | DateTime| 创建时间       |
| updated_at    | DateTime| 更新时间       |

---

## 四、数据模型

### 4.1 客户 (Customer)

| 字段               | 类型    | 说明                      |
| ------------------ | ------- | ------------------------- |
| id                 | UUID    | 主键                      |
| code               | String  | 客户编码 (自动 300-XXXX)  |
| company_name       | String  | 公司名称                  |
| category           | String  | 客户分类                  |
| nationality        | String  | 国籍                      |
| reg_no             | String  | 注册号                    |
| attention          | String  | 联系人                    |
| phone              | String  | 电话                      |
| mobile             | String  | 手机                      |
| fax                | String  | 传真                      |
| email              | String  | 邮箱                      |
| currency           | Enum    | 默认货币 MYR/RMB/USD      |
| outstanding_amount | Decimal | 应收余额                  |
| is_active          | Boolean | 是否启用                  |
| created_at         | DateTime| 创建时间                  |
| updated_at         | DateTime| 更新时间                  |

### 4.2 客户分支 (CustomerBranch)

| 字段        | 类型   | 说明               |
| ----------- | ------ | ------------------ |
| id          | UUID   | 主键               |
| customer_id | UUID   | 关联客户           |
| branch_name | String | 分支名称 (BILLING) |
| address_1   | String | 地址行1            |
| address_2   | String | 地址行2            |
| address_3   | String | 地址行3            |
| address_4   | String | 地址行4            |
| country     | String | 国家               |
| postcode    | String | 邮编               |
| city        | String | 城市               |
| state       | String | 州                 |
| phone       | String | 电话               |
| mobile      | String | 手机               |
| fax         | String | 传真               |
| email       | String | 邮箱               |

### 4.3 供应商 (Supplier)

结构同 Customer，区别：
- code 前缀为 400-XXXX
- 额外字段: industries_code (行业代码), supplier_category (供应商分类)
- outstanding_amount 为应付余额

### 4.4 供应商分支 (SupplierBranch)

结构同 CustomerBranch。

### 4.5 物料主数据 (StockItem)

| 字段              | 类型    | 说明                     |
| ----------------- | ------- | ------------------------ |
| id                | UUID    | 主键                     |
| code              | String  | 物料编码                 |
| description       | String  | 描述                     |
| group_id          | UUID    | 物料组                   |
| category_id       | UUID    | 物料分类                 |
| base_uom          | String  | 基本单位 (KG/TON/PCS)   |
| reorder_level     | Decimal | 安全库存                 |
| reorder_qty       | Decimal | 订货量                   |
| lead_time         | Int     | 采购提前期(天)           |
| ref_cost          | Decimal | 参考成本                 |
| ref_price         | Decimal | 参考价格                 |
| barcode           | String  | 条形码                   |
| shelf             | String  | 货架位                   |
| output_tax_rate   | Decimal | 销项税率                 |
| input_tax_rate    | Decimal | 进项税率                 |
| stock_control     | Boolean | 是否启用库存控制         |
| serial_no_tracking| Boolean | 是否启用序列号跟踪       |
| is_active         | Boolean | 是否启用                 |
| created_at        | DateTime| 创建时间                 |
| updated_at        | DateTime| 更新时间                 |

### 4.6 物料单位换算 (StockItemUOM)

| 字段      | 类型    | 说明           |
| --------- | ------- | -------------- |
| id        | UUID    | 主键           |
| item_id   | UUID    | 关联物料       |
| uom       | String  | 单位           |
| rate      | Decimal | 换算率         |
| ref_cost  | Decimal | 参考成本       |
| ref_price | Decimal | 参考价格       |
| is_base   | Boolean | 是否基本单位   |

### 4.7 物料辅助表

- **StockGroup**: id, name, description
- **StockCategory**: id, name, description
- **StockLocation**: id, name, description

### 4.8 库存余额 (StockBalance)

| 字段         | 类型    | 说明       |
| ------------ | ------- | ---------- |
| id           | UUID    | 主键       |
| item_id      | UUID    | 物料       |
| location_id  | UUID    | 仓库位置   |
| quantity     | Decimal | 库存数量   |
| reserved_qty | Decimal | 预留数量   |

### 4.9 库存操作 (StockTransaction)

| 字段              | 类型   | 说明                               |
| ----------------- | ------ | ---------------------------------- |
| id                | UUID   | 主键                               |
| type              | Enum   | RECEIVED/ISSUE/ADJUSTMENT/TRANSFER |
| doc_no            | String | 单据编号                           |
| date              | Date   | 日期                               |
| location_from     | UUID   | 来源位置                           |
| location_to       | UUID   | 目标位置                           |
| ref_document_type | String | 关联单据类型                       |
| ref_document_id   | UUID   | 关联单据ID                         |
| created_by        | UUID   | 操作人                             |
| created_at        | DateTime| 创建时间                          |

**StockTransactionItem**: id, transaction_id, item_id, qty, uom, unit_cost, notes

### 4.10 销售单据 (SalesDocument)

| 字段              | 类型    | 说明                                    |
| ----------------- | ------- | --------------------------------------- |
| id                | UUID    | 主键                                    |
| type              | Enum    | QUOTATION/SALES_ORDER/DELIVERY_ORDER/INVOICE/CASH_SALE |
| doc_no            | String  | 单据编号 (自动生成)                      |
| customer_id       | UUID    | 客户                                    |
| branch_id         | UUID    | 客户分支                                |
| date              | Date    | 日期                                    |
| agent             | String  | 业务员                                  |
| terms             | String  | 付款条款                                |
| description       | String  | 描述                                    |
| project           | String  | 项目编号                                |
| ref_no            | String  | 参考单号                                |
| ext_no            | String  | 外部单号                                |
| currency          | Enum    | 货币 MYR/RMB/USD                        |
| exchange_rate     | Decimal | 汇率                                    |
| subtotal          | Decimal | 小计                                    |
| tax_amount        | Decimal | 税额                                    |
| total             | Decimal | 总额                                    |
| deposit_amount    | Decimal | 已收定金                                |
| outstanding       | Decimal | 未收金额                                |
| status            | Enum    | DRAFT/APPROVED/CANCELLED/TRANSFERRED    |
| e_invoice_status  | String  | 电子发票状态                            |
| is_transferable   | Boolean | 是否可转单                              |
| is_cancelled      | Boolean | 是否取消                                |
| ref_doc_id        | UUID    | 来源单据 (转单时关联)                    |
| created_by        | UUID    | 创建人                                  |
| created_at        | DateTime| 创建时间                                |
| updated_at        | DateTime| 更新时间                                |

### 4.11 销售单据行项 (SalesDocumentItem)

| 字段        | 类型    | 说明       |
| ----------- | ------- | ---------- |
| id          | UUID    | 主键       |
| document_id | UUID    | 关联单据   |
| item_id     | UUID    | 物料       |
| description | String  | 描述       |
| qty         | Decimal | 数量       |
| uom         | String  | 单位       |
| unit_price  | Decimal | 单价       |
| discount    | Decimal | 折扣       |
| subtotal    | Decimal | 小计       |
| tax_code    | String  | 税码       |
| tax_rate    | Decimal | 税率       |
| tax_inclusive| Boolean| 含税       |
| tax_amount  | Decimal | 税额       |
| total       | Decimal | 含税总额   |

### 4.12 客户财务单据

- **CustomerPayment**: id, customer_id, doc_no, date, amount, currency, method, ref_no, notes
- **CustomerDeposit**: id, customer_id, doc_no, date, amount, currency, notes
- **CustomerDebitNote**: id, customer_id, doc_no, date, currency, subtotal, tax_amount, total, items[]
- **CustomerCreditNote**: 同 DebitNote 结构
- **CustomerRefund**: id, customer_id, doc_no, date, amount, ref_payment_id, notes

### 4.13 采购单据 (PurchaseDocument)

结构同 SalesDocument，区别：
- type: REQUEST/ORDER/GOODS_RECEIVED/INVOICE/CASH_PURCHASE
- 关联 supplier_id 而非 customer_id
- 额外字段在行项中

### 4.14 采购单据行项 (PurchaseDocumentItem)

SalesDocumentItem 基础上额外字段：

| 字段                | 类型    | 说明               |
| ------------------- | ------- | ------------------ |
| planned_weight      | Decimal | 预计来货重量       |
| actual_weight       | Decimal | 实际到货重量       |
| planned_arrival_date| Date    | 预计到港时间       |
| actual_arrival_date | Date    | 实际到货时间       |
| payment_method      | String  | 付款方式           |
| weight_unit         | String  | 重量单位 KG/TON    |

### 4.15 供应商财务单据

镜像客户财务单据：
- SupplierPayment, SupplierDeposit, SupplierDebitNote,
  SupplierCreditNote, SupplierRefund

### 4.16 来料检验 (IncomingInspection)

| 字段                   | 类型    | 说明                              |
| ---------------------- | ------- | --------------------------------- |
| id                     | UUID    | 主键                              |
| purchase_doc_id        | UUID    | 关联采购单据                      |
| purchase_doc_item_id   | UUID    | 关联采购行项                      |
| item_id                | UUID    | 物料                              |
| supplier_id            | UUID    | 供应商                            |
| inspection_date        | Date    | 检验日期                          |
| wrong_item             | Boolean | 是否错货                          |
| wrong_item_description | String  | 错货说明                          |
| weight_difference      | Decimal | 重量差异                          |
| handling_method        | Enum    | RETURN/REPLENISH/CONCESSION/SCRAP |
| handling_notes         | String  | 处理备注                          |
| inspector_id           | UUID    | 检验人                            |
| status                 | Enum    | PENDING/PASSED/REJECTED/CONCESSION|
| created_at             | DateTime| 创建时间                          |

### 4.17 BOM 物料清单 (BOM) - 多层级

| 字段           | 类型    | 说明       |
| -------------- | ------- | ---------- |
| id             | UUID    | 主键       |
| product_item_id| UUID    | 成品物料   |
| version        | String  | 版本号     |
| description    | String  | 描述       |
| is_active      | Boolean | 是否启用   |

### 4.18 BOM 明细 (BOMItem)

| 字段             | 类型    | 说明                          |
| ---------------- | ------- | ----------------------------- |
| id               | UUID    | 主键                          |
| bom_id           | UUID    | 关联 BOM                     |
| material_item_id | UUID    | 原材料物料                    |
| quantity         | Decimal | 用量                          |
| uom              | String  | 单位                          |
| is_sub_assembly  | Boolean | 是否半成品 (有则递归展开子BOM)|

### 4.19 生产单 (JobOrder)

| 字段             | 类型    | 说明                                    |
| ---------------- | ------- | --------------------------------------- |
| id               | UUID    | 主键                                    |
| doc_no           | String  | 单据编号                                |
| product_item_id  | UUID    | 成品物料                                |
| bom_id           | UUID    | 关联 BOM                               |
| planned_qty      | Decimal | 计划数量                                |
| completed_qty    | Decimal | 完成数量                                |
| color            | String  | 颜色                                    |
| planned_weight   | Decimal | 计划生产重量                            |
| actual_weight    | Decimal | 实际产出重量                            |
| yield_rate       | Decimal | 出成率 (%)                              |
| production_cycle | Int     | 生产周期 (天)                           |
| planned_start    | Date    | 计划开始                                |
| planned_end      | Date    | 计划结束                                |
| actual_start     | Date    | 实际开始                                |
| actual_end       | Date    | 实际结束                                |
| status           | Enum    | PLANNED/IN_PROGRESS/COMPLETED/CANCELLED |
| created_by       | UUID    | 创建人                                  |
| created_at       | DateTime| 创建时间                                |

### 4.20 生产领料明细 (JobOrderMaterial)

| 字段               | 类型    | 说明           |
| ------------------ | ------- | -------------- |
| id                 | UUID    | 主键           |
| job_order_id       | UUID    | 关联生产单     |
| material_item_id   | UUID    | 原材料物料     |
| required_qty       | Decimal | 需求数量       |
| issued_qty         | Decimal | 已领数量       |
| actual_used_weight | Decimal | 实际消耗重量   |
| uom                | String  | 单位           |
| raw_material_batch_id | UUID | 关联原材料批次 |

### 4.21 原材料批次 (RawMaterialBatch)

| 字段                 | 类型    | 说明                        |
| -------------------- | ------- | --------------------------- |
| id                   | UUID    | 主键                        |
| traceability_code    | String  | 原材料溯源码 RM-YYYYMMDD-XXX|
| item_id              | UUID    | 物料                        |
| purchase_doc_id      | UUID    | 关联采购单                  |
| purchase_doc_item_id | UUID    | 关联采购行项                |
| inspection_id        | UUID    | 关联来料检验                |
| supplier_id          | UUID    | 供应商                      |
| weight               | Decimal | 入库重量                    |
| weight_unit          | String  | 重量单位 KG/TON             |
| warehouse_location_id| UUID    | 仓库位置                    |
| received_date        | Date    | 入库日期                    |
| remaining_weight     | Decimal | 剩余重量 (领料后递减)       |
| status               | Enum    | IN_STOCK/CONSUMED/PARTIAL   |
| created_at           | DateTime| 创建时间                    |

### 4.22 成品 (FinishedProduct)

| 字段                | 类型    | 说明                           |
| ------------------- | ------- | ------------------------------ |
| id                  | UUID    | 主键                           |
| traceability_code   | String  | 成品溯源码 FP-YYYYMMDD-XXX     |
| item_id             | UUID    | 物料                           |
| job_order_id        | UUID    | 关联生产单                     |
| production_date     | Date    | 生产日期                       |
| color               | String  | 颜色                           |
| weight              | Decimal | 重量                           |
| weight_unit         | String  | 重量单位                       |
| warehouse_location_id| UUID   | 仓库位置                       |
| qr_code_data        | JSON    | 二维码数据                     |
| status              | Enum    | IN_STOCK/SHIPPED/RESERVED      |
| created_at          | DateTime| 创建时间                       |

### 4.23 成品原料关联 (FinishedProductMaterial)

| 字段                  | 类型    | 说明             |
| --------------------- | ------- | ---------------- |
| id                    | UUID    | 主键             |
| finished_product_id   | UUID    | 关联成品         |
| raw_material_batch_id | UUID    | 关联原材料批次   |
| used_weight           | Decimal | 消耗重量         |

### 4.24 公共配置

**Currency (货币)**:
| 字段          | 说明                |
| ------------- | ------------------- |
| code          | MYR / RMB / USD     |
| name          | 马币 / 人民币 / 美金|
| symbol        | RM / ¥ / $          |
| exchange_rate | 对基准货币汇率      |
| is_base       | 是否基准货币 (MYR)  |

**TaxCode (税码)**: code, description, rate (%)

**DocNumberSequence (单据编号序列)**: type, prefix, next_number, format

---

## 五、业务流程

### 5.1 完整业务流程图

```
【采购流程】
Purchase Request → Purchase Order → Goods Received → Purchase Invoice
  采购申请          采购订单            收货入库          采购发票
                   +预计重量                              ↓
                   +预计到港时间                       供应商付款
                   +付款方式
                        ↓
                   Goods Received
                   +实际到货重量
                   +实际到货时间
                        ↓
                   来料检验 (IncomingInspection)
                   +错货检查
                   +重量差异
                   +处理方式
                        ↓
                   ┌─ 合格 → 原材料入库 → 生成原材料 QR 码 (RM-xxx)
                   └─ 不合格 → 退货/报废

【生产流程】
BOM 定义 (多层级) → 创建生产单 (Job Order)
                      +颜色 +计划重量 +生产周期
                           ↓
                      领料 (从原材料批次领料，扣减库存)
                           ↓
                      生产执行
                           ↓
                      产出登记 +实际重量 +出成率计算
                           ↓
                      成品入库 → 生成成品 QR 码 (FP-xxx)
                      关联：原材料批次 ← 生产单 → 成品

【销售流程】
Quotation → Sales Order → Delivery Order → Invoice
  报价单      销售订单        出货单          发票
                                ↓               ↓
                           成品出库          客户付款
                           (扣减库存)

【溯源链路】
扫描成品 QR 码 → 查看成品信息 + 生产信息 + 原材料来源
扫描原材料 QR 码 → 查看原材料信息 + 采购信息 + 检验结果
```

### 5.2 单据流转关系

```
采购侧:                              销售侧:
Purchase Request  ──转单──▶           Quotation  ──转单──▶
Purchase Order    ──转单──▶           Sales Order  ──转单──▶
Goods Received    ──转单──▶           Delivery Order  ──转单──▶
Purchase Invoice                      Invoice
       ↓                                    ↓
Supplier Payment                      Customer Payment
```

### 5.3 QR 码溯源数据

**原材料 QR 码 (扫码展示):**
- 原材料溯源码、物料编码、物料名称、重量、仓库位置、入库日期
- 采购单号、供应商、供应商国籍、预计/实际重量、到港日期、付款方式
- 检验日期、检验结果、重量差异、错货信息

**成品 QR 码 (扫码展示):**
- 成品溯源码、物料编码、物料名称、颜色、重量、仓库位置、入库日期
- 生产单号、生产日期、出成率、生产周期
- 所有使用的原材料批次列表 (可点击查看原材料详情)
- 出货信息 (如已出货：出货单号、客户)

---

## 六、系统模块清单

### 6.1 功能模块

| 模块       | 子功能                                                       |
| ---------- | ------------------------------------------------------------ |
| 登录与权限 | 登录、用户管理、角色管理                                     |
| 客户管理   | 客户CRUD、分支管理、付款、定金、借项/贷项通知、退款           |
| 供应商管理 | 供应商CRUD、分支管理、付款、定金、借项/贷项通知、退款         |
| 销售管理   | 报价单、销售订单、出货单、发票、现金销售、单据转换             |
| 采购管理   | 采购申请、采购订单、收货、采购发票、现金采购、退货、单据转换   |
| 库存管理   | 物料CRUD、物料组/分类/位置、入库、出库、调整、调拨、库存盘点   |
| 来料检验   | 检验记录、错货处理、重量差异处理                             |
| 生产管理   | BOM定义(多层级)、生产单、领料、产出登记、组装/拆解            |
| 成品管理   | 成品入库、QR码生成、库存查看                                 |
| 溯源查询   | 扫码查询、原材料追溯、成品追溯                               |
| 系统设置   | 货币管理、汇率设置、税码管理、单据编号规则                   |

---

## 七、部署架构

```yaml
# docker-compose.yml 结构
services:
  web:        # React 前端 (Nginx)
    ports: 80
  server:     # NestJS 后端
    ports: 3000
    depends_on: db
  db:         # PostgreSQL
    ports: 5432
    volumes: pgdata
```

---

## 八、关键设计决策

1. **Sales/Purchase 统一 Document 模型** - 用 type 字段区分单据类型，支持通过 ref_doc_id 实现单据间流转
2. **BOM 多层级通过 is_sub_assembly 标记** - 如果材料本身有 BOM 则递归展开，用 PostgreSQL WITH RECURSIVE 查询
3. **两级 QR 码溯源** - 原材料入库生成 RM-xxx，成品入库生成 FP-xxx，成品可追溯到所有原材料来源
4. **重量为核心计量** - 采购/生产/库存均以重量为主要跟踪维度
5. **来料检验独立模块** - 不合并在收货流程中，独立记录错货/错重量/处理方式
