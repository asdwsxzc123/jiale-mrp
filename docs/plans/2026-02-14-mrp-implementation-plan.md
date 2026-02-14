# Jiale ERP MRP 系统实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建一套完整的 MRP 系统，覆盖客户、供应商、销售、采购、库存、来料检验、生产、成品管理、溯源查询全流程。

**Architecture:** Monorepo 单体应用。前端 React + Ant Design Pro 提供中文界面，后端 NestJS + Prisma ORM 提供 REST API，PostgreSQL 存储数据。Docker Compose 一键部署。

**Tech Stack:** React 18, Ant Design Pro, NestJS, Prisma, PostgreSQL 16, Docker Compose, TypeScript

**Design Doc:** `docs/plans/2026-02-14-mrp-system-design.md`

---

## Phase 1: 项目脚手架与基础设施

### Task 1: 初始化 Monorepo 结构

**Files:**
- Create: `package.json` (root)
- Create: `packages/server/package.json`
- Create: `packages/web/package.json`
- Create: `.gitignore`
- Create: `.nvmrc`

**Step 1: 创建根 package.json**

```json
{
  "name": "jiale-erp",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "dev:server": "npm run dev --workspace=packages/server",
    "dev:web": "npm run dev --workspace=packages/web",
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:web\"",
    "build": "npm run build --workspace=packages/server && npm run build --workspace=packages/web"
  },
  "devDependencies": {
    "concurrently": "^9.0.0"
  }
}
```

**Step 2: 创建 .gitignore**

```
node_modules/
dist/
.env
*.log
.DS_Store
```

**Step 3: 创建 .nvmrc**

```
20
```

**Step 4: 提交**

```bash
git add package.json .gitignore .nvmrc
git commit -m "chore: init monorepo structure"
```

---

### Task 2: 初始化 NestJS 后端

**Files:**
- Create: `packages/server/` (NestJS 项目)

**Step 1: 使用 NestJS CLI 创建项目**

```bash
cd packages
npx @nestjs/cli new server --package-manager npm --skip-git
```

**Step 2: 安装 Prisma 及相关依赖**

```bash
cd packages/server
npm install @prisma/client class-validator class-transformer
npm install -D prisma
npx prisma init
```

**Step 3: 安装 JWT 认证依赖**

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
npm install -D @types/passport-jwt @types/bcrypt
```

**Step 4: 安装 Swagger 文档依赖**

```bash
npm install @nestjs/swagger
```

**Step 5: 验证 NestJS 启动**

```bash
npm run start:dev
```
Expected: 应用在 http://localhost:3000 启动

**Step 6: 提交**

```bash
git add packages/server/
git commit -m "chore: init NestJS backend with Prisma and JWT deps"
```

---

### Task 3: 初始化 React 前端

**Files:**
- Create: `packages/web/` (React 项目)

**Step 1: 使用 Vite 创建 React TypeScript 项目**

```bash
cd packages
npm create vite@latest web -- --template react-ts
```

**Step 2: 安装 Ant Design Pro 相关依赖**

```bash
cd packages/web
npm install antd @ant-design/pro-components @ant-design/pro-layout
npm install react-router-dom axios dayjs
npm install @ant-design/icons
```

**Step 3: 安装 QR 码相关依赖**

```bash
npm install qrcode.react html5-qrcode
npm install -D @types/qrcode.react
```

**Step 4: 验证 React 启动**

```bash
npm run dev
```
Expected: 应用在 http://localhost:5173 启动

**Step 5: 提交**

```bash
git add packages/web/
git commit -m "chore: init React frontend with Ant Design Pro"
```

---

### Task 4: Docker Compose 配置

**Files:**
- Create: `docker-compose.yml`
- Create: `packages/server/Dockerfile`
- Create: `packages/web/Dockerfile`
- Create: `packages/web/nginx.conf`

**Step 1: 创建 docker-compose.yml**

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    env_file: .env
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER"]
      interval: 5s
      timeout: 5s
      retries: 5

  server:
    build:
      context: ./packages/server
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      db:
        condition: service_healthy

  web:
    build:
      context: ./packages/web
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - server

volumes:
  pgdata:
```

**Step 2: 创建后端 Dockerfile**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

**Step 3: 创建前端 Dockerfile 和 nginx.conf**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass http://server:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Step 4: 创建 .env.example（仅占位符，不含真实密码）和 .env（不提交到 git）**

Create: `.env.example`（提交到 git）
```
# PostgreSQL
POSTGRES_USER=jiale
POSTGRES_PASSWORD=<CHANGE_ME>
POSTGRES_DB=jiale_erp

# Backend
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
JWT_SECRET=<CHANGE_ME_TO_RANDOM_64_CHAR_STRING>

# Seed
ADMIN_INIT_PASSWORD=<CHANGE_ME>
```

Create: `.env`（已在 .gitignore 中，不会提交）
```
POSTGRES_USER=jiale
POSTGRES_PASSWORD=<生成一个随机强密码>
POSTGRES_DB=jiale_erp
DATABASE_URL=postgresql://jiale:<同上密码>@localhost:5432/jiale_erp
JWT_SECRET=<运行 openssl rand -hex 32 生成>
ADMIN_INIT_PASSWORD=<设置一个强密码>
```

> **安全规则：`.env` 文件已在 `.gitignore` 中，绝不提交到版本库。只提交 `.env.example`。**

**Step 5: 验证 Docker Compose 构建**

```bash
docker compose up db -d
```
Expected: PostgreSQL 容器启动成功

**Step 6: 提交**

```bash
git add docker-compose.yml packages/server/Dockerfile packages/web/Dockerfile packages/web/nginx.conf packages/server/.env.example
git commit -m "chore: add Docker Compose config for full stack deployment"
```

---

## Phase 2: 数据库 Schema 定义

> **重要：Phase 2 的 Task 5-10 全部写入同一个 `schema.prisma` 文件，但不要在中间步骤执行迁移。**
> **所有模型写完后，在 Task 10 的最后一步统一执行一次 `prisma migrate dev`。**
> **这是因为 Prisma 的关系字段要求两端模型同时存在，中间迁移会因为前向引用而失败。**

### Task 5: Prisma Schema - 用户与权限

**Files:**
- Modify: `packages/server/prisma/schema.prisma`

**注意：本 Task 只写文件，不执行迁移。迁移统一在 Task 10 最后执行。**

**Step 1: 编写 User 模型**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== 用户与权限 ====================

enum Role {
  ADMIN
  MANAGER
  OPERATOR
  VIEWER
}

model User {
  id            String   @id @default(uuid())
  username      String   @unique
  passwordHash  String   @map("password_hash")
  name          String
  role          Role     @default(OPERATOR)
  isActive      Boolean  @default(true) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@map("users")
}
```

**Step 2: 不要执行迁移，只保存文件。继续 Task 6。**

**Step 3: 提交 schema 进度**

```bash
git add packages/server/prisma/
git commit -m "feat(schema): add User model with role-based access"
```

---

### Task 6: Prisma Schema - 客户与供应商

**Files:**
- Modify: `packages/server/prisma/schema.prisma`

**Step 1: 添加 Currency 枚举和客户/供应商模型**

```prisma
// ==================== 公共枚举 ====================

enum CurrencyCode {
  MYR
  RMB
  USD
}

// ==================== 客户 ====================

model Customer {
  id                String        @id @default(uuid())
  code              String        @unique  // 300-XXXX
  companyName       String        @map("company_name")
  category          String?
  nationality       String?
  regNo             String?       @map("reg_no")
  attention         String?
  phone             String?
  mobile            String?
  fax               String?
  email             String?
  currency          CurrencyCode  @default(MYR)
  outstandingAmount Decimal       @default(0) @map("outstanding_amount") @db.Decimal(15, 2)
  isActive          Boolean       @default(true) @map("is_active")
  createdAt         DateTime      @default(now()) @map("created_at")
  updatedAt         DateTime      @updatedAt @map("updated_at")

  branches          CustomerBranch[]
  salesDocuments    SalesDocument[]
  payments          CustomerPayment[]
  deposits          CustomerDeposit[]
  debitNotes        CustomerDebitNote[]
  creditNotes       CustomerCreditNote[]
  refunds           CustomerRefund[]

  @@map("customers")
}

model CustomerBranch {
  id          String   @id @default(uuid())
  customerId  String   @map("customer_id")
  branchName  String   @map("branch_name")
  address1    String?  @map("address_1")
  address2    String?  @map("address_2")
  address3    String?  @map("address_3")
  address4    String?  @map("address_4")
  country     String?
  postcode    String?
  city        String?
  state       String?
  phone       String?
  mobile      String?
  fax         String?
  email       String?

  customer    Customer @relation(fields: [customerId], references: [id])

  @@map("customer_branches")
}

// ==================== 供应商 ====================

model Supplier {
  id                String        @id @default(uuid())
  code              String        @unique  // 400-XXXX
  companyName       String        @map("company_name")
  category          String?       @map("supplier_category")
  nationality       String?
  industriesCode    String?       @map("industries_code")
  regNo             String?       @map("reg_no")
  attention         String?
  phone             String?
  mobile            String?
  fax               String?
  email             String?
  currency          CurrencyCode  @default(MYR)
  outstandingAmount Decimal       @default(0) @map("outstanding_amount") @db.Decimal(15, 2)
  isActive          Boolean       @default(true) @map("is_active")
  createdAt         DateTime      @default(now()) @map("created_at")
  updatedAt         DateTime      @updatedAt @map("updated_at")

  branches           SupplierBranch[]
  purchaseDocuments  PurchaseDocument[]
  payments           SupplierPayment[]
  deposits           SupplierDeposit[]
  debitNotes         SupplierDebitNote[]
  creditNotes        SupplierCreditNote[]
  refunds            SupplierRefund[]
  inspections        IncomingInspection[]
  rawMaterialBatches RawMaterialBatch[]

  @@map("suppliers")
}

model SupplierBranch {
  id          String   @id @default(uuid())
  supplierId  String   @map("supplier_id")
  branchName  String   @map("branch_name")
  address1    String?  @map("address_1")
  address2    String?  @map("address_2")
  address3    String?  @map("address_3")
  address4    String?  @map("address_4")
  country     String?
  postcode    String?
  city        String?
  state       String?
  phone       String?
  mobile      String?
  fax         String?
  email       String?

  supplier    Supplier @relation(fields: [supplierId], references: [id])

  @@map("supplier_branches")
}
```

**Step 2: 不要执行迁移，只保存文件。继续 Task 7。**

**Step 3: 提交 schema 进度**

```bash
git add packages/server/prisma/
git commit -m "feat(schema): add Customer and Supplier models with branches"
```

---

### Task 7: Prisma Schema - 库存与物料

**Files:**
- Modify: `packages/server/prisma/schema.prisma`

**Step 1: 添加库存相关模型**

```prisma
// ==================== 库存 ====================

model StockGroup {
  id          String      @id @default(uuid())
  name        String      @unique
  description String?
  items       StockItem[]

  @@map("stock_groups")
}

model StockCategory {
  id          String      @id @default(uuid())
  name        String      @unique
  description String?
  items       StockItem[]

  @@map("stock_categories")
}

model StockLocation {
  id          String           @id @default(uuid())
  name        String           @unique
  description String?
  balances    StockBalance[]

  @@map("stock_locations")
}

model StockItem {
  id                String          @id @default(uuid())
  code              String          @unique
  description       String
  groupId           String?         @map("group_id")
  categoryId        String?         @map("category_id")
  baseUom           String          @default("KG") @map("base_uom")
  reorderLevel      Decimal         @default(0) @map("reorder_level") @db.Decimal(15, 2)
  reorderQty        Decimal         @default(0) @map("reorder_qty") @db.Decimal(15, 2)
  leadTime          Int             @default(0) @map("lead_time") // 天
  refCost           Decimal         @default(0) @map("ref_cost") @db.Decimal(15, 2)
  refPrice          Decimal         @default(0) @map("ref_price") @db.Decimal(15, 2)
  barcode           String?
  shelf             String?
  outputTaxRate     Decimal         @default(0) @map("output_tax_rate") @db.Decimal(5, 2)
  inputTaxRate      Decimal         @default(0) @map("input_tax_rate") @db.Decimal(5, 2)
  stockControl      Boolean         @default(true) @map("stock_control")
  serialNoTracking  Boolean         @default(false) @map("serial_no_tracking")
  isActive          Boolean         @default(true) @map("is_active")
  createdAt         DateTime        @default(now()) @map("created_at")
  updatedAt         DateTime        @updatedAt @map("updated_at")

  group             StockGroup?     @relation(fields: [groupId], references: [id])
  category          StockCategory?  @relation(fields: [categoryId], references: [id])
  uoms              StockItemUOM[]
  balances          StockBalance[]

  @@map("stock_items")
}

model StockItemUOM {
  id        String   @id @default(uuid())
  itemId    String   @map("item_id")
  uom       String
  rate      Decimal  @default(1) @db.Decimal(15, 4)
  refCost   Decimal  @default(0) @map("ref_cost") @db.Decimal(15, 2)
  refPrice  Decimal  @default(0) @map("ref_price") @db.Decimal(15, 2)
  isBase    Boolean  @default(false) @map("is_base")

  item      StockItem @relation(fields: [itemId], references: [id])

  @@map("stock_item_uoms")
}

model StockBalance {
  id          String        @id @default(uuid())
  itemId      String        @map("item_id")
  locationId  String        @map("location_id")
  quantity    Decimal       @default(0) @db.Decimal(15, 2)
  reservedQty Decimal       @default(0) @map("reserved_qty") @db.Decimal(15, 2)

  item        StockItem     @relation(fields: [itemId], references: [id])
  location    StockLocation @relation(fields: [locationId], references: [id])

  @@unique([itemId, locationId])
  @@map("stock_balances")
}

enum StockTransactionType {
  RECEIVED
  ISSUE
  ADJUSTMENT
  TRANSFER
  ASSEMBLY      // 组装（多个原材料 → 一个成品）
  DISASSEMBLY   // 拆解（一个成品 → 多个原材料）
}

model StockTransaction {
  id               String               @id @default(uuid())
  type             StockTransactionType
  docNo            String               @map("doc_no")
  date             DateTime             @db.Date
  locationFromId   String?              @map("location_from_id")
  locationToId     String?              @map("location_to_id")
  refDocumentType  String?              @map("ref_document_type")
  refDocumentId    String?              @map("ref_document_id")
  createdBy        String?              @map("created_by")
  createdAt        DateTime             @default(now()) @map("created_at")

  items            StockTransactionItem[]

  @@map("stock_transactions")
}

model StockTransactionItem {
  id            String           @id @default(uuid())
  transactionId String           @map("transaction_id")
  itemId        String           @map("item_id")
  qty           Decimal          @db.Decimal(15, 2)
  uom           String
  unitCost      Decimal          @default(0) @map("unit_cost") @db.Decimal(15, 2)
  notes         String?

  transaction   StockTransaction @relation(fields: [transactionId], references: [id])

  @@map("stock_transaction_items")
}
```

**Step 2: 不要执行迁移，只保存文件。继续 Task 8。**

**Step 3: 提交 schema 进度**

```bash
git add packages/server/prisma/
git commit -m "feat(schema): add Stock, StockItem, StockBalance, StockTransaction models"
```

---

### Task 8: Prisma Schema - 销售与采购单据

**Files:**
- Modify: `packages/server/prisma/schema.prisma`

**Step 1: 添加销售/采购单据模型**

```prisma
// ==================== 销售单据 ====================

enum SalesDocumentType {
  QUOTATION
  SALES_ORDER
  DELIVERY_ORDER
  INVOICE
  CASH_SALE
}

enum DocumentStatus {
  DRAFT
  APPROVED
  CANCELLED
  TRANSFERRED
}

model SalesDocument {
  id              String            @id @default(uuid())
  type            SalesDocumentType
  docNo           String            @unique @map("doc_no")
  customerId      String            @map("customer_id")
  branchId        String?           @map("branch_id")
  date            DateTime          @db.Date
  agent           String?
  terms           String?
  description     String?
  project         String?
  refNo           String?           @map("ref_no")
  extNo           String?           @map("ext_no")
  currency        CurrencyCode      @default(MYR)
  exchangeRate    Decimal           @default(1) @map("exchange_rate") @db.Decimal(10, 4)
  subtotal        Decimal           @default(0) @db.Decimal(15, 2)
  taxAmount       Decimal           @default(0) @map("tax_amount") @db.Decimal(15, 2)
  total           Decimal           @default(0) @db.Decimal(15, 2)
  depositAmount   Decimal           @default(0) @map("deposit_amount") @db.Decimal(15, 2)
  outstanding     Decimal           @default(0) @db.Decimal(15, 2)
  status          DocumentStatus    @default(DRAFT)
  eInvoiceStatus  String?           @map("e_invoice_status")
  isTransferable  Boolean           @default(true) @map("is_transferable")
  // isCancelled 已移除：使用 status=CANCELLED 即可，避免状态不一致
  refDocId        String?           @map("ref_doc_id")
  createdBy       String?           @map("created_by")
  createdAt       DateTime          @default(now()) @map("created_at")
  updatedAt       DateTime          @updatedAt @map("updated_at")

  customer        Customer          @relation(fields: [customerId], references: [id])
  items           SalesDocumentItem[]

  @@map("sales_documents")
}

model SalesDocumentItem {
  id           String        @id @default(uuid())
  documentId   String        @map("document_id")
  itemId       String?       @map("item_id")
  description  String?
  qty          Decimal       @default(0) @db.Decimal(15, 2)
  uom          String?
  unitPrice    Decimal       @default(0) @map("unit_price") @db.Decimal(15, 2)
  discount     Decimal       @default(0) @db.Decimal(15, 2)
  subtotal     Decimal       @default(0) @db.Decimal(15, 2)
  taxCode      String?       @map("tax_code")
  taxRate      Decimal       @default(0) @map("tax_rate") @db.Decimal(5, 2)
  taxInclusive Boolean       @default(false) @map("tax_inclusive")
  taxAmount    Decimal       @default(0) @map("tax_amount") @db.Decimal(15, 2)
  total        Decimal       @default(0) @db.Decimal(15, 2)

  document     SalesDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@map("sales_document_items")
}

// ==================== 采购单据 ====================

enum PurchaseDocumentType {
  REQUEST
  ORDER
  GOODS_RECEIVED
  INVOICE
  CASH_PURCHASE
  RETURNED          // 采购退货
}

model PurchaseDocument {
  id              String               @id @default(uuid())
  type            PurchaseDocumentType
  docNo           String               @unique @map("doc_no")
  supplierId      String               @map("supplier_id")
  branchId        String?              @map("branch_id")
  date            DateTime             @db.Date
  agent           String?
  terms           String?
  description     String?
  project         String?
  refNo           String?              @map("ref_no")
  extNo           String?              @map("ext_no")
  currency        CurrencyCode         @default(MYR)
  exchangeRate    Decimal              @default(1) @map("exchange_rate") @db.Decimal(10, 4)
  subtotal        Decimal              @default(0) @db.Decimal(15, 2)
  taxAmount       Decimal              @default(0) @map("tax_amount") @db.Decimal(15, 2)
  total           Decimal              @default(0) @db.Decimal(15, 2)
  outstanding     Decimal              @default(0) @db.Decimal(15, 2)
  status          DocumentStatus       @default(DRAFT)
  isTransferable  Boolean              @default(true) @map("is_transferable")
  isCancelled     Boolean              @default(false) @map("is_cancelled")
  refDocId        String?              @map("ref_doc_id")
  createdBy       String?              @map("created_by")
  createdAt       DateTime             @default(now()) @map("created_at")
  updatedAt       DateTime             @updatedAt @map("updated_at")

  supplier        Supplier             @relation(fields: [supplierId], references: [id])
  items           PurchaseDocumentItem[]

  @@map("purchase_documents")
}

model PurchaseDocumentItem {
  id                  String           @id @default(uuid())
  documentId          String           @map("document_id")
  itemId              String?          @map("item_id")
  description         String?
  qty                 Decimal          @default(0) @db.Decimal(15, 2)
  uom                 String?
  unitPrice           Decimal          @default(0) @map("unit_price") @db.Decimal(15, 2)
  discount            Decimal          @default(0) @db.Decimal(15, 2)
  subtotal            Decimal          @default(0) @db.Decimal(15, 2)
  taxCode             String?          @map("tax_code")
  taxRate             Decimal          @default(0) @map("tax_rate") @db.Decimal(5, 2)
  taxInclusive        Boolean          @default(false) @map("tax_inclusive")
  taxAmount           Decimal          @default(0) @map("tax_amount") @db.Decimal(15, 2)
  total               Decimal          @default(0) @db.Decimal(15, 2)
  // 采购特有字段
  plannedWeight       Decimal?         @map("planned_weight") @db.Decimal(15, 2)
  actualWeight        Decimal?         @map("actual_weight") @db.Decimal(15, 2)
  plannedArrivalDate  DateTime?        @map("planned_arrival_date") @db.Date
  actualArrivalDate   DateTime?        @map("actual_arrival_date") @db.Date
  paymentMethod       String?          @map("payment_method")
  weightUnit          String?          @default("KG") @map("weight_unit")

  document            PurchaseDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@map("purchase_document_items")
}
```

**Step 2: 不要执行迁移，只保存文件。继续 Task 9。**

**Step 3: 提交 schema 进度**

```bash
git add packages/server/prisma/
git commit -m "feat(schema): add SalesDocument and PurchaseDocument models"
```

---

### Task 9: Prisma Schema - 财务单据

**Files:**
- Modify: `packages/server/prisma/schema.prisma`

**Step 1: 添加客户/供应商财务单据模型**

```prisma
// ==================== 客户财务单据 ====================

model CustomerPayment {
  id         String       @id @default(uuid())
  customerId String       @map("customer_id")
  docNo      String       @unique @map("doc_no")
  date       DateTime     @db.Date
  amount     Decimal      @db.Decimal(15, 2)
  currency   CurrencyCode @default(MYR)
  method     String?      // 现金/银行转账/支票
  refNo      String?      @map("ref_no")
  notes      String?
  createdAt  DateTime     @default(now()) @map("created_at")

  customer   Customer     @relation(fields: [customerId], references: [id])

  @@map("customer_payments")
}

model CustomerDeposit {
  id         String       @id @default(uuid())
  customerId String       @map("customer_id")
  docNo      String       @unique @map("doc_no")
  date       DateTime     @db.Date
  amount     Decimal      @db.Decimal(15, 2)
  currency   CurrencyCode @default(MYR)
  notes      String?
  createdAt  DateTime     @default(now()) @map("created_at")

  customer   Customer     @relation(fields: [customerId], references: [id])

  @@map("customer_deposits")
}

model CustomerDebitNote {
  id         String       @id @default(uuid())
  customerId String       @map("customer_id")
  docNo      String       @unique @map("doc_no")
  date       DateTime     @db.Date
  currency   CurrencyCode @default(MYR)
  subtotal   Decimal      @default(0) @db.Decimal(15, 2)
  taxAmount  Decimal      @default(0) @map("tax_amount") @db.Decimal(15, 2)
  total      Decimal      @default(0) @db.Decimal(15, 2)
  notes      String?
  createdAt  DateTime     @default(now()) @map("created_at")

  customer   Customer     @relation(fields: [customerId], references: [id])

  @@map("customer_debit_notes")
}

model CustomerCreditNote {
  id         String       @id @default(uuid())
  customerId String       @map("customer_id")
  docNo      String       @unique @map("doc_no")
  date       DateTime     @db.Date
  currency   CurrencyCode @default(MYR)
  subtotal   Decimal      @default(0) @db.Decimal(15, 2)
  taxAmount  Decimal      @default(0) @map("tax_amount") @db.Decimal(15, 2)
  total      Decimal      @default(0) @db.Decimal(15, 2)
  notes      String?
  createdAt  DateTime     @default(now()) @map("created_at")

  customer   Customer     @relation(fields: [customerId], references: [id])

  @@map("customer_credit_notes")
}

model CustomerRefund {
  id           String       @id @default(uuid())
  customerId   String       @map("customer_id")
  docNo        String       @unique @map("doc_no")
  date         DateTime     @db.Date
  amount       Decimal      @db.Decimal(15, 2)
  refPaymentId String?      @map("ref_payment_id")
  notes        String?
  createdAt    DateTime     @default(now()) @map("created_at")

  customer     Customer     @relation(fields: [customerId], references: [id])

  @@map("customer_refunds")
}

// ==================== 供应商财务单据 ====================

model SupplierPayment {
  id         String       @id @default(uuid())
  supplierId String       @map("supplier_id")
  docNo      String       @unique @map("doc_no")
  date       DateTime     @db.Date
  amount     Decimal      @db.Decimal(15, 2)
  currency   CurrencyCode @default(MYR)
  method     String?
  refNo      String?      @map("ref_no")
  notes      String?
  createdAt  DateTime     @default(now()) @map("created_at")

  supplier   Supplier     @relation(fields: [supplierId], references: [id])

  @@map("supplier_payments")
}

model SupplierDeposit {
  id         String       @id @default(uuid())
  supplierId String       @map("supplier_id")
  docNo      String       @unique @map("doc_no")
  date       DateTime     @db.Date
  amount     Decimal      @db.Decimal(15, 2)
  currency   CurrencyCode @default(MYR)
  notes      String?
  createdAt  DateTime     @default(now()) @map("created_at")

  supplier   Supplier     @relation(fields: [supplierId], references: [id])

  @@map("supplier_deposits")
}

model SupplierDebitNote {
  id         String       @id @default(uuid())
  supplierId String       @map("supplier_id")
  docNo      String       @unique @map("doc_no")
  date       DateTime     @db.Date
  currency   CurrencyCode @default(MYR)
  subtotal   Decimal      @default(0) @db.Decimal(15, 2)
  taxAmount  Decimal      @default(0) @map("tax_amount") @db.Decimal(15, 2)
  total      Decimal      @default(0) @db.Decimal(15, 2)
  notes      String?
  createdAt  DateTime     @default(now()) @map("created_at")

  supplier   Supplier     @relation(fields: [supplierId], references: [id])

  @@map("supplier_debit_notes")
}

model SupplierCreditNote {
  id         String       @id @default(uuid())
  supplierId String       @map("supplier_id")
  docNo      String       @unique @map("doc_no")
  date       DateTime     @db.Date
  currency   CurrencyCode @default(MYR)
  subtotal   Decimal      @default(0) @db.Decimal(15, 2)
  taxAmount  Decimal      @default(0) @map("tax_amount") @db.Decimal(15, 2)
  total      Decimal      @default(0) @db.Decimal(15, 2)
  notes      String?
  createdAt  DateTime     @default(now()) @map("created_at")

  supplier   Supplier     @relation(fields: [supplierId], references: [id])

  @@map("supplier_credit_notes")
}

model SupplierRefund {
  id           String       @id @default(uuid())
  supplierId   String       @map("supplier_id")
  docNo        String       @unique @map("doc_no")
  date         DateTime     @db.Date
  amount       Decimal      @db.Decimal(15, 2)
  refPaymentId String?      @map("ref_payment_id")
  notes        String?
  createdAt    DateTime     @default(now()) @map("created_at")

  supplier     Supplier     @relation(fields: [supplierId], references: [id])

  @@map("supplier_refunds")
}
```

**Step 2: 不要执行迁移，只保存文件。继续 Task 10。**

**Step 3: 提交 schema 进度**

```bash
git add packages/server/prisma/
git commit -m "feat(schema): add Customer and Supplier financial document models"
```

---

### Task 10: Prisma Schema - 来料检验、BOM、生产、成品溯源

**Files:**
- Modify: `packages/server/prisma/schema.prisma`

**Step 1: 添加来料检验模型**

```prisma
// ==================== 来料检验 ====================

enum InspectionStatus {
  PENDING
  PASSED
  REJECTED
  CONCESSION
}

enum HandlingMethod {
  RETURN
  REPLENISH
  CONCESSION
  SCRAP
}

model IncomingInspection {
  id                    String           @id @default(uuid())
  purchaseDocId         String           @map("purchase_doc_id")
  purchaseDocItemId     String?          @map("purchase_doc_item_id")
  itemId                String           @map("item_id")
  supplierId            String           @map("supplier_id")
  inspectionDate        DateTime         @map("inspection_date") @db.Date
  wrongItem             Boolean          @default(false) @map("wrong_item")
  wrongItemDescription  String?          @map("wrong_item_description")
  weightDifference      Decimal?         @map("weight_difference") @db.Decimal(15, 2)
  handlingMethod        HandlingMethod?  @map("handling_method")
  handlingNotes         String?          @map("handling_notes")
  inspectorId           String?          @map("inspector_id")
  status                InspectionStatus @default(PENDING)
  createdAt             DateTime         @default(now()) @map("created_at")

  supplier              Supplier         @relation(fields: [supplierId], references: [id])
  rawMaterialBatches    RawMaterialBatch[] // 反向关系：检验合格后生成的原材料批次

  @@map("incoming_inspections")
}
```

**Step 2: 添加 BOM 模型**

```prisma
// ==================== BOM 物料清单 ====================

model BOM {
  id             String    @id @default(uuid())
  productItemId  String    @map("product_item_id")
  version        String    @default("V1.0")
  description    String?
  isActive       Boolean   @default(true) @map("is_active")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  items          BOMItem[]
  jobOrders      JobOrder[]

  @@map("boms")
}

model BOMItem {
  id              String  @id @default(uuid())
  bomId           String  @map("bom_id")
  materialItemId  String  @map("material_item_id")
  quantity        Decimal @db.Decimal(15, 4)
  uom             String
  isSubAssembly   Boolean @default(false) @map("is_sub_assembly")

  bom             BOM     @relation(fields: [bomId], references: [id], onDelete: Cascade)

  @@map("bom_items")
}
```

**Step 3: 添加生产单模型**

```prisma
// ==================== 生产 ====================

enum JobOrderStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model JobOrder {
  id              String         @id @default(uuid())
  docNo           String         @unique @map("doc_no")
  productItemId   String         @map("product_item_id")
  bomId           String?        @map("bom_id")
  plannedQty      Decimal        @default(0) @map("planned_qty") @db.Decimal(15, 2)
  completedQty    Decimal        @default(0) @map("completed_qty") @db.Decimal(15, 2)
  color           String?
  plannedWeight   Decimal?       @map("planned_weight") @db.Decimal(15, 2)
  actualWeight    Decimal?       @map("actual_weight") @db.Decimal(15, 2)
  yieldRate       Decimal?       @map("yield_rate") @db.Decimal(5, 2) // 百分比
  productionCycle Int?           @map("production_cycle") // 天
  plannedStart    DateTime?      @map("planned_start") @db.Date
  plannedEnd      DateTime?      @map("planned_end") @db.Date
  actualStart     DateTime?      @map("actual_start") @db.Date
  actualEnd       DateTime?      @map("actual_end") @db.Date
  status          JobOrderStatus @default(PLANNED)
  createdBy       String?        @map("created_by")
  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")

  bom             BOM?           @relation(fields: [bomId], references: [id])
  materials       JobOrderMaterial[]
  finishedProducts FinishedProduct[]

  @@map("job_orders")
}

model JobOrderMaterial {
  id                  String   @id @default(uuid())
  jobOrderId          String   @map("job_order_id")
  materialItemId      String   @map("material_item_id")
  requiredQty         Decimal  @default(0) @map("required_qty") @db.Decimal(15, 2)
  issuedQty           Decimal  @default(0) @map("issued_qty") @db.Decimal(15, 2)
  actualUsedWeight    Decimal? @map("actual_used_weight") @db.Decimal(15, 2)
  uom                 String
  rawMaterialBatchId  String?  @map("raw_material_batch_id")

  jobOrder            JobOrder @relation(fields: [jobOrderId], references: [id], onDelete: Cascade)

  @@map("job_order_materials")
}
```

**Step 4: 添加原材料批次和成品溯源模型**

```prisma
// ==================== 原材料批次 (QR 溯源) ====================

enum BatchStatus {
  IN_STOCK
  CONSUMED
  PARTIAL
}

model RawMaterialBatch {
  id                  String           @id @default(uuid())
  traceabilityCode    String           @unique @map("traceability_code") // RM-YYYYMMDD-XXX
  itemId              String           @map("item_id")
  purchaseDocId       String?          @map("purchase_doc_id")
  purchaseDocItemId   String?          @map("purchase_doc_item_id")
  inspectionId        String?          @map("inspection_id")
  supplierId          String?          @map("supplier_id")
  weight              Decimal          @db.Decimal(15, 2)
  weightUnit          String           @default("KG") @map("weight_unit")
  warehouseLocationId String?          @map("warehouse_location_id")
  receivedDate        DateTime         @map("received_date") @db.Date
  remainingWeight     Decimal          @db.Decimal(15, 2) @map("remaining_weight")
  status              BatchStatus      @default(IN_STOCK)
  createdAt           DateTime         @default(now()) @map("created_at")

  // 外键关系（保证数据完整性，支持 Prisma include 联查）
  item                StockItem        @relation(fields: [itemId], references: [id])
  purchaseDoc         PurchaseDocument? @relation(fields: [purchaseDocId], references: [id])
  inspection          IncomingInspection? @relation(fields: [inspectionId], references: [id])
  supplier            Supplier?        @relation(fields: [supplierId], references: [id])
  warehouseLocation   StockLocation?   @relation("RawMaterialLocation", fields: [warehouseLocationId], references: [id])

  @@map("raw_material_batches")
}

// ==================== 成品 (QR 溯源) ====================

enum FinishedProductStatus {
  IN_STOCK
  SHIPPED
  RESERVED
}

model FinishedProduct {
  id                  String                @id @default(uuid())
  traceabilityCode    String                @unique @map("traceability_code") // FP-YYYYMMDD-XXX
  itemId              String                @map("item_id")
  jobOrderId          String?               @map("job_order_id")
  productionDate      DateTime?             @map("production_date") @db.Date
  color               String?
  weight              Decimal               @db.Decimal(15, 2)
  weightUnit          String                @default("KG") @map("weight_unit")
  warehouseLocationId String?               @map("warehouse_location_id")
  qrCodeData          Json?                 @map("qr_code_data")
  status              FinishedProductStatus @default(IN_STOCK)
  createdAt           DateTime              @default(now()) @map("created_at")

  // 外键关系
  item                StockItem             @relation(fields: [itemId], references: [id])
  jobOrder            JobOrder?             @relation(fields: [jobOrderId], references: [id])
  warehouseLocation   StockLocation?        @relation("FinishedProductLocation", fields: [warehouseLocationId], references: [id])
  materials           FinishedProductMaterial[]

  @@map("finished_products")
}

model FinishedProductMaterial {
  id                  String          @id @default(uuid())
  finishedProductId   String          @map("finished_product_id")
  rawMaterialBatchId  String          @map("raw_material_batch_id")
  usedWeight          Decimal         @db.Decimal(15, 2) @map("used_weight")

  finishedProduct     FinishedProduct @relation(fields: [finishedProductId], references: [id], onDelete: Cascade)

  @@map("finished_product_materials")
}
```

**Step 5: 添加公共配置模型**

```prisma
// ==================== 公共配置 ====================

model Currency {
  id           String       @id @default(uuid())
  code         CurrencyCode @unique
  name         String
  symbol       String
  exchangeRate Decimal      @default(1) @map("exchange_rate") @db.Decimal(10, 4)
  isBase       Boolean      @default(false) @map("is_base")

  @@map("currencies")
}

model TaxCode {
  id          String  @id @default(uuid())
  code        String  @unique
  description String?
  rate        Decimal @db.Decimal(5, 2) // 百分比

  @@map("tax_codes")
}

model DocNumberSequence {
  id         String @id @default(uuid())
  type       String @unique // SALES_INVOICE, PURCHASE_ORDER, etc.
  prefix     String
  nextNumber Int    @default(1) @map("next_number")
  format     String @default("{prefix}-{number:5}") // 格式模板

  @@map("doc_number_sequences")
}
```

**Step 5.5: 回到之前的模型补充反向关系字段**

在 StockItem 模型中添加:
```prisma
  rawMaterialBatches  RawMaterialBatch[]
  finishedProducts    FinishedProduct[]
```

在 StockLocation 模型中添加:
```prisma
  rawMaterialBatches  RawMaterialBatch[] @relation("RawMaterialLocation")
  finishedProducts    FinishedProduct[]  @relation("FinishedProductLocation")
```

在 PurchaseDocument 模型中添加:
```prisma
  rawMaterialBatches  RawMaterialBatch[]
```

在 IncomingInspection 模型中已添加（Step 1 已含）:
```prisma
  rawMaterialBatches  RawMaterialBatch[]
```

> **这一步确保所有 Prisma 关系都有双向定义，迁移才能成功。**

**Step 6: 统一执行迁移（Phase 2 唯一一次迁移）**

此时 schema.prisma 包含了 Task 5-10 的所有模型，所有关系字段都有对应模型，可以安全迁移。

```bash
cd packages/server
npx prisma migrate dev --name init-all-models
```
Expected: 迁移成功，一次性生成所有表

**Step 7: 验证迁移**

```bash
npx prisma studio
```
Expected: 打开 Prisma Studio，能看到所有表

**Step 8: 提交**

```bash
git add packages/server/prisma/
git commit -m "feat(schema): add Inspection, BOM, Production, Traceability models and run initial migration"
```

---

### Task 11: 数据库种子数据

**Files:**
- Create: `packages/server/prisma/seed.ts`

**Step 1: 编写种子数据**

```typescript
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
```

**Step 2: 在 package.json 中添加 seed 命令**

在 `packages/server/package.json` 的 prisma 配置中添加:
```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

**Step 3: 运行种子数据**

```bash
npx prisma db seed
```

**Step 4: 提交**

```bash
git add packages/server/prisma/seed.ts packages/server/package.json
git commit -m "feat: add database seed data with default admin, currencies, tax codes"
```

---

## Phase 3: 后端核心模块

### Task 12: Auth 模块 - JWT 认证

**Files:**
- Create: `packages/server/src/modules/auth/auth.module.ts`
- Create: `packages/server/src/modules/auth/auth.service.ts`
- Create: `packages/server/src/modules/auth/auth.controller.ts`
- Create: `packages/server/src/modules/auth/jwt.strategy.ts`
- Create: `packages/server/src/modules/auth/dto/login.dto.ts`
- Create: `packages/server/src/guards/roles.guard.ts`
- Create: `packages/server/src/guards/roles.decorator.ts`
- Test: `packages/server/src/modules/auth/auth.service.spec.ts`

**实现要点:**
1. POST `/api/auth/login` - 用户名密码登录，返回 JWT token
2. GET `/api/auth/profile` - 获取当前用户信息
3. JwtStrategy 从 token 解析用户
4. RolesGuard 根据角色控制访问权限
5. `@Roles(Role.ADMIN)` 装饰器标注所需角色

**测试:**
- 测试正确密码登录返回 token
- 测试错误密码登录返回 401
- 测试 token 过期返回 401
- 测试角色权限守卫

**提交:** `feat: add JWT auth module with role-based access control`

---

### Task 13: Prisma 服务封装

**Files:**
- Create: `packages/server/src/modules/prisma/prisma.module.ts`
- Create: `packages/server/src/modules/prisma/prisma.service.ts`

**实现要点:**
1. PrismaService extends PrismaClient
2. 实现 onModuleInit 连接数据库
3. 全局模块，所有模块可注入

**提交:** `feat: add global Prisma service module`

---

### Task 14: 单据编号生成服务

**Files:**
- Create: `packages/server/src/modules/common/doc-number.service.ts`
- Test: `packages/server/src/modules/common/doc-number.service.spec.ts`

**实现要点:**
1. `generateDocNo(type: string)` - 根据类型生成下一个编号
2. 使用数据库事务保证原子性（防止并发生成重复编号）
3. 格式: `{prefix}-{number:5}` → `IV-00001`

**测试:**
- 测试生成第一个编号
- 测试连续生成递增编号

**提交:** `feat: add document number generation service`

---

### Task 15: Customer 模块 - 后端 CRUD

**Files:**
- Create: `packages/server/src/modules/customer/customer.module.ts`
- Create: `packages/server/src/modules/customer/customer.service.ts`
- Create: `packages/server/src/modules/customer/customer.controller.ts`
- Create: `packages/server/src/modules/customer/dto/create-customer.dto.ts`
- Create: `packages/server/src/modules/customer/dto/update-customer.dto.ts`
- Test: `packages/server/src/modules/customer/customer.controller.spec.ts`

**API 接口:**
- `GET    /api/customers` - 列表（分页、搜索、筛选）
- `GET    /api/customers/:id` - 详情（含分支）
- `POST   /api/customers` - 创建（自动生成 300-XXXX 编码）
- `PUT    /api/customers/:id` - 更新
- `DELETE /api/customers/:id` - 删除（软删除 isActive=false）
- `POST   /api/customers/:id/branches` - 添加分支
- `PUT    /api/customers/:id/branches/:branchId` - 更新分支
- `DELETE /api/customers/:id/branches/:branchId` - 删除分支

**提交:** `feat: add Customer CRUD API with branch management`

---

### Task 16: Supplier 模块 - 后端 CRUD

**Files:** 镜像 Customer 模块结构

**API 接口:** 同 Customer，路径为 `/api/suppliers`，编码前缀 400-XXXX

**提交:** `feat: add Supplier CRUD API with branch management`

---

### Task 17: StockItem 模块 - 后端 CRUD

**Files:**
- Create: `packages/server/src/modules/stock/stock.module.ts`
- Create: `packages/server/src/modules/stock/stock-item.service.ts`
- Create: `packages/server/src/modules/stock/stock-item.controller.ts`
- Create: `packages/server/src/modules/stock/stock-group.controller.ts`
- Create: `packages/server/src/modules/stock/stock-category.controller.ts`
- Create: `packages/server/src/modules/stock/stock-location.controller.ts`
- Create: `packages/server/src/modules/stock/stock-balance.service.ts`
- Create: `packages/server/src/modules/stock/stock-transaction.service.ts`
- Create: `packages/server/src/modules/stock/stock-transaction.controller.ts`

**API 接口:**
- 物料 CRUD: `/api/stock/items`
- 物料组 CRUD: `/api/stock/groups`
- 物料分类 CRUD: `/api/stock/categories`
- 仓库位置 CRUD: `/api/stock/locations`
- 库存余额查询: `GET /api/stock/balances`
- 库存操作: `POST /api/stock/transactions` (入库/出库/调整/调拨)

**提交:** `feat: add Stock module with item, balance, and transaction APIs`

---

### Task 18: Sales 模块 - 后端

**Files:**
- Create: `packages/server/src/modules/sales/sales.module.ts`
- Create: `packages/server/src/modules/sales/sales-document.service.ts`
- Create: `packages/server/src/modules/sales/sales-document.controller.ts`
- Create: `packages/server/src/modules/sales/customer-payment.controller.ts`
- Create: `packages/server/src/modules/sales/dto/`

**API 接口:**
- 销售单据 CRUD: `/api/sales/documents` (支持 type 筛选)
- 单据转换: `POST /api/sales/documents/:id/transfer` (报价单→销售单→出货单→发票)
- 审批: `POST /api/sales/documents/:id/approve`
- 取消: `POST /api/sales/documents/:id/cancel`
- 客户付款: `/api/sales/payments`
- 客户定金: `/api/sales/deposits`
- 借项通知: `/api/sales/debit-notes`
- 贷项通知: `/api/sales/credit-notes`
- 客户退款: `/api/sales/refunds`

**关键逻辑:**
- **出货单(Delivery Order)审批时扣减库存**（不是发票，发票只做财务记录）
- 单据转换自动复制行项数据
- 付款时自动更新客户应收余额
- 发票创建时更新客户应收余额（outstanding_amount）

**提交:** `feat: add Sales module with document workflow and financial operations`

---

### Task 19: Purchase 模块 - 后端

**Files:** 镜像 Sales 模块，路径 `/api/purchase/`

**额外 API:**
- 采购退货: `POST /api/purchase/documents/:id/return` (从收货单或发票创建退货单)
- 退货时自动回退库存

**额外逻辑:**
- 收货时采购行项记录 actual_weight 和 actual_arrival_date
- 收货后自动触发来料检验创建
- 采购发票关联供应商付款
- 退货单创建时反向扣减库存余额

**提交:** `feat: add Purchase module with weight tracking, goods receiving, and returns`

---

### Task 20: Inspection 模块 - 后端

**Files:**
- Create: `packages/server/src/modules/inspection/inspection.module.ts`
- Create: `packages/server/src/modules/inspection/inspection.service.ts`
- Create: `packages/server/src/modules/inspection/inspection.controller.ts`

**API 接口:**
- `GET    /api/inspections` - 检验记录列表
- `GET    /api/inspections/:id` - 检验详情
- `POST   /api/inspections` - 创建检验记录
- `PUT    /api/inspections/:id` - 更新检验结果
- `POST   /api/inspections/:id/pass` - 标记合格 → 生成原材料批次 + 原材料QR码
- `POST   /api/inspections/:id/reject` - 标记不合格

**关键逻辑:**
- 合格后自动创建 RawMaterialBatch 记录
- 自动生成溯源码 RM-YYYYMMDD-XXX
- 同步更新库存

**提交:** `feat: add Incoming Inspection module with raw material batch creation`

---

### Task 21: Production 模块 - 后端

**Files:**
- Create: `packages/server/src/modules/production/production.module.ts`
- Create: `packages/server/src/modules/production/bom.service.ts`
- Create: `packages/server/src/modules/production/bom.controller.ts`
- Create: `packages/server/src/modules/production/job-order.service.ts`
- Create: `packages/server/src/modules/production/job-order.controller.ts`

**API 接口:**
- BOM CRUD: `/api/production/boms`
- BOM 展开（递归）: `GET /api/production/boms/:id/expand`
- 生产单 CRUD: `/api/production/job-orders`
- 领料: `POST /api/production/job-orders/:id/issue-material`
- 产出登记: `POST /api/production/job-orders/:id/output`
- 完工: `POST /api/production/job-orders/:id/complete`
- 组装: `POST /api/production/assembly` (多个原材料 → 一个成品，走 StockTransaction ASSEMBLY)
- 拆解: `POST /api/production/disassembly` (一个成品 → 多个原材料，走 StockTransaction DISASSEMBLY)

**关键逻辑:**
- BOM 展开用 PostgreSQL WITH RECURSIVE 递归查询
- 领料时从 RawMaterialBatch 扣减 remainingWeight
- 产出登记时计算出成率 = actual_weight / 投入总重量
- 完工时自动创建 FinishedProduct + 成品QR码

**提交:** `feat: add Production module with multi-level BOM and job order workflow`

---

### Task 22: Traceability 模块 - 后端

**Files:**
- Create: `packages/server/src/modules/trace/trace.module.ts`
- Create: `packages/server/src/modules/trace/trace.service.ts`
- Create: `packages/server/src/modules/trace/trace.controller.ts`

**API 接口:**
- `GET /api/trace/raw-material/:code` - 原材料溯源查询
- `GET /api/trace/finished-product/:code` - 成品溯源查询
- `GET /api/trace/scan/:code` - 通用扫码查询（自动识别 RM-/FP- 前缀）

**返回数据结构:** 见设计文档 Section 5.3 QR 码溯源数据

**提交:** `feat: add Traceability module with QR code scan API`

---

### Task 23: Settings 模块 - 后端

**Files:**
- Create: `packages/server/src/modules/common/common.module.ts`
- Create: `packages/server/src/modules/common/currency.controller.ts`
- Create: `packages/server/src/modules/common/tax-code.controller.ts`
- Create: `packages/server/src/modules/common/user-management.controller.ts`

**API 接口:**
- 货币 CRUD + 汇率更新: `/api/settings/currencies`
- 税码 CRUD: `/api/settings/tax-codes`
- 用户管理 CRUD: `/api/settings/users` (仅 ADMIN)

**提交:** `feat: add Settings module with currency, tax code, and user management`

---

## Phase 4: 前端页面

### Task 24: 前端项目结构 + 路由 + 布局

**Files:**
- Modify: `packages/web/src/App.tsx`
- Create: `packages/web/src/layouts/MainLayout.tsx` (侧边栏 + 顶部栏)
- Create: `packages/web/src/router/index.tsx`
- Create: `packages/web/src/services/api.ts` (Axios 封装)
- Create: `packages/web/src/stores/auth.ts` (登录状态)

**实现要点:**
1. ProLayout 侧边栏菜单（对标截图的左侧菜单结构）
2. 路由守卫（未登录跳转登录页）
3. Axios 拦截器（自动附加 JWT token）

**提交:** `feat: add frontend layout, routing, and auth store`

---

### Task 25: 登录页面

**Files:**
- Create: `packages/web/src/pages/auth/Login.tsx`

**实现:** Ant Design Pro 登录表单，用户名+密码，调用 `/api/auth/login`

**提交:** `feat: add login page`

---

### Task 26: 客户管理页面

**Files:**
- Create: `packages/web/src/pages/customer/CustomerList.tsx` (列表页，含搜索/筛选/分页)
- Create: `packages/web/src/pages/customer/CustomerForm.tsx` (新增/编辑表单，含分支管理 Tabs)
- Create: `packages/web/src/services/customer.ts` (API 调用)

**对标截图:** Maintain Customer 列表页 + 详情表单

**提交:** `feat: add Customer management pages`

---

### Task 27: 供应商管理页面

**Files:** 镜像客户页面

**提交:** `feat: add Supplier management pages`

---

### Task 28: 库存管理页面

**Files:**
- Create: `packages/web/src/pages/stock/StockItemList.tsx`
- Create: `packages/web/src/pages/stock/StockItemForm.tsx` (含 UOM Tabs)
- Create: `packages/web/src/pages/stock/StockGroupList.tsx`
- Create: `packages/web/src/pages/stock/StockCategoryList.tsx`
- Create: `packages/web/src/pages/stock/StockLocationList.tsx`
- Create: `packages/web/src/pages/stock/StockBalanceList.tsx`
- Create: `packages/web/src/pages/stock/StockTransactionList.tsx`
- Create: `packages/web/src/pages/stock/StockTransactionForm.tsx`

**对标截图:** Stock 模块所有子页面

**提交:** `feat: add Stock management pages`

---

### Task 29: 销售管理页面

**Files:**
- Create: `packages/web/src/pages/sales/SalesDocumentList.tsx` (Tabs 切换单据类型)
- Create: `packages/web/src/pages/sales/InvoiceForm.tsx` (发票表单，含行项编辑表格)
- Create: `packages/web/src/pages/sales/QuotationForm.tsx`
- Create: `packages/web/src/pages/sales/SalesOrderForm.tsx`
- Create: `packages/web/src/pages/sales/DeliveryOrderForm.tsx`
- Create: `packages/web/src/pages/sales/CustomerPaymentList.tsx`
- Create: `packages/web/src/pages/sales/CustomerPaymentForm.tsx`
- (其他财务单据页面类似)

**对标截图:** Sales 模块 + Invoice 列表/表单

**关键组件:** 可编辑表格（行项目增删改），行内计算（数量×单价-折扣+税）

**提交:** `feat: add Sales management pages with document workflow`

---

### Task 30: 采购管理页面

**Files:** 镜像销售页面，额外字段: 预计重量/到港时间/实际重量/付款方式

**对标截图:** Purchase 模块

**提交:** `feat: add Purchase management pages with weight tracking`

---

### Task 31: 来料检验页面

**Files:**
- Create: `packages/web/src/pages/inspection/InspectionList.tsx`
- Create: `packages/web/src/pages/inspection/InspectionForm.tsx`

**关键交互:** 合格→自动跳转到原材料批次页面确认

**提交:** `feat: add Incoming Inspection pages`

---

### Task 32: 生产管理页面

**Files:**
- Create: `packages/web/src/pages/production/BOMList.tsx`
- Create: `packages/web/src/pages/production/BOMForm.tsx` (可视化多层级 BOM 编辑)
- Create: `packages/web/src/pages/production/JobOrderList.tsx`
- Create: `packages/web/src/pages/production/JobOrderForm.tsx`
- Create: `packages/web/src/pages/production/JobOrderDetail.tsx` (领料/产出/完工操作)

**对标截图:** Production 模块

**提交:** `feat: add Production management pages with BOM and job order`

---

### Task 33: 成品管理 + QR 码页面

**Files:**
- Create: `packages/web/src/pages/production/FinishedProductList.tsx`
- Create: `packages/web/src/pages/production/FinishedProductDetail.tsx`
- Create: `packages/web/src/components/QRCodeGenerator.tsx` (QR 码生成+打印)
- Create: `packages/web/src/pages/trace/RawMaterialBatchList.tsx`
- Create: `packages/web/src/pages/trace/RawMaterialBatchDetail.tsx`

**关键功能:**
- 原材料批次列表显示 QR 码（可打印）
- 成品列表显示 QR 码（可打印）
- 批量打印 QR 码

**提交:** `feat: add Finished Product pages with QR code generation`

---

### Task 34: 溯源查询页面

**Files:**
- Create: `packages/web/src/pages/trace/TraceScan.tsx` (扫码/输入溯源码)
- Create: `packages/web/src/pages/trace/TraceResult.tsx` (溯源结果展示)

**关键功能:**
- 支持摄像头扫描 QR 码（使用 html5-qrcode）
- 支持手动输入溯源码
- 展示完整溯源链路（原材料 QR 或成品 QR）

**提交:** `feat: add Traceability scan and result pages`

---

### Task 35: 系统设置页面

**Files:**
- Create: `packages/web/src/pages/settings/CurrencySettings.tsx`
- Create: `packages/web/src/pages/settings/TaxCodeSettings.tsx`
- Create: `packages/web/src/pages/settings/UserManagement.tsx`

**提交:** `feat: add Settings pages for currency, tax code, and user management`

---

## Phase 5: 集成测试与部署

### Task 36: 端到端流程验证

**验证完整业务流程:**
1. 登录系统
2. 创建供应商 → 创建采购订单 → 收货 → 来料检验 → 原材料入库（QR码生成）
3. 创建 BOM → 创建生产单 → 领料 → 产出 → 成品入库（QR码生成）
4. 创建客户 → 创建销售单 → 出货 → 发票 → 收款
5. 扫描溯源码 → 查看完整溯源链路

**提交:** `test: verify end-to-end business workflow`

---

### Task 37: Docker 部署验证

**步骤:**
1. `docker compose build`
2. `docker compose up -d`
3. 访问 http://localhost 验证前端
4. 访问 http://localhost/api 验证后端
5. 验证数据库连接和种子数据

**提交:** `chore: verify Docker Compose deployment`

---

## 任务依赖关系

```
Phase 1 (Task 1-4):   脚手架 → 全部并行
Phase 2 (Task 5-11):  Schema → 顺序执行（每个依赖前一个）
Phase 3 (Task 12-23): 后端模块 → 12,13 先行，其余可并行
Phase 4 (Task 24-35): 前端页面 → 24,25 先行，其余可并行
Phase 5 (Task 36-37): 集成验证 → 依赖全部完成
```

---

## 关键提醒

1. **每个 Task 完成后立即 commit**
2. **每个后端模块完成后输出 Swagger API 文档**
3. **所有金额字段使用 Decimal(15,2)，重量字段使用 Decimal(15,2)**
4. **所有列表页面支持分页、搜索、排序**
5. **所有表单使用 Ant Design ProFormFields 组件**
6. **权限守卫：VIEWER 只能 GET，OPERATOR 不能 DELETE/APPROVE**
