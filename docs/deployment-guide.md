# Jiale ERP 部署与启动指南

## 环境要求

| 依赖 | 版本 |
|------|------|
| Node.js | >= 20 |
| pnpm | >= 8 |
| PostgreSQL | >= 16 |
| Docker + Docker Compose | (仅 Docker 部署需要) |

---

## 方式一：本地开发启动

### 1. 安装依赖

```bash
# 项目根目录
pnpm install
```

### 2. 配置环境变量

```bash
# 复制示例配置
cp .env.example .env
```

编辑 `.env` 文件，填写以下内容：

```env
# PostgreSQL 连接（本地开发连 localhost）
POSTGRES_USER=jiale
POSTGRES_PASSWORD=你的数据库密码
POSTGRES_DB=jiale_erp
DATABASE_URL=postgresql://jiale:你的数据库密码@localhost:5432/jiale_erp

# JWT 密钥（运行 openssl rand -hex 32 生成）
JWT_SECRET=你的随机密钥

# 管理员初始密码
ADMIN_INIT_PASSWORD=你的管理员密码
```

### 3. 启动 PostgreSQL

可以用 Docker 单独启动数据库：

```bash
docker compose up db -d
```

或使用本地已安装的 PostgreSQL，确保数据库 `jiale_erp` 已创建：

```bash
createdb jiale_erp
```

### 4. 数据库迁移与种子数据

```bash
cd packages/server

# 生成 Prisma Client
npx prisma generate

# 执行数据库迁移（首次运行会创建所有表）
npx prisma migrate dev --name init

# 写入种子数据（管理员账号、货币、税码、仓库等）
npx prisma db seed
```

### 5. 启动后端

```bash
cd packages/server
pnpm run dev
```

后端启动后可访问：
- API 服务：http://localhost:3000/api
- Swagger 文档：http://localhost:3000/api/docs

### 6. 启动前端

```bash
cd packages/web
pnpm run dev
```

前端启动后可访问：http://localhost:5173

### 7. 登录系统

使用种子数据创建的管理员账号：
- 用户名：`admin`
- 密码：`.env` 中 `ADMIN_INIT_PASSWORD` 设置的值

---

## 方式二：Docker Compose 一键部署

### 1. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，**注意 Docker 环境下 DATABASE_URL 的 host 是 `db`**（Docker 服务名）：

```env
POSTGRES_USER=jiale
POSTGRES_PASSWORD=一个强密码
POSTGRES_DB=jiale_erp
DATABASE_URL=postgresql://jiale:一个强密码@db:5432/jiale_erp
JWT_SECRET=运行openssl_rand_-hex_32生成
ADMIN_INIT_PASSWORD=管理员密码
```

### 2. 构建并启动所有服务

```bash
docker compose up --build -d
```

这会启动三个容器：
| 服务 | 端口 | 说明 |
|------|------|------|
| db | 5432 | PostgreSQL 16 数据库 |
| server | 3000 | NestJS 后端 API |
| web | 80 | Nginx + React 前端 |

### 3. 执行数据库迁移（首次部署）

```bash
# 进入后端容器执行迁移
docker compose exec server npx prisma migrate deploy

# 写入种子数据
docker compose exec server npx prisma db seed
```

### 4. 访问系统

- 前端页面：http://localhost
- API 接口：http://localhost/api （通过 Nginx 反向代理）
- Swagger 文档：http://localhost:3000/api/docs （直连后端）

### 5. 查看日志

```bash
# 查看所有服务日志
docker compose logs -f

# 查看单个服务日志
docker compose logs -f server
docker compose logs -f web
docker compose logs -f db
```

### 6. 停止服务

```bash
docker compose down

# 停止并删除数据卷（会清除数据库数据）
docker compose down -v
```

---

## 常用运维命令

### Prisma 数据库管理

```bash
cd packages/server

# 查看数据库表（浏览器 GUI）
npx prisma studio

# 重置数据库（删除所有数据，重新迁移+种子）
npx prisma migrate reset

# 生产环境执行迁移（不会触发种子）
npx prisma migrate deploy
```

### 项目构建

```bash
# 构建后端
cd packages/server && pnpm run build

# 构建前端
cd packages/web && pnpm run build

# 根目录一键构建
pnpm run build
```

### 前后端同时启动（开发模式）

```bash
# 根目录
pnpm run dev
```

需要先安装根目录依赖（含 concurrently）：`pnpm install`

---

## API 接口一览

| 模块 | 路径前缀 | 说明 |
|------|----------|------|
| 认证 | `/api/auth` | 登录、获取用户信息 |
| 客户 | `/api/customers` | 客户 CRUD + 分支管理 |
| 供应商 | `/api/suppliers` | 供应商 CRUD + 分支管理 |
| 库存 | `/api/stock` | 物料/物料组/分类/仓库/余额/操作 |
| 销售 | `/api/sales` | 销售单据/客户付款 |
| 采购 | `/api/purchase` | 采购单据/供应商付款 |
| 检验 | `/api/inspections` | 来料检验（合格/不合格） |
| 生产 | `/api/production` | BOM/生产单/领料/产出/完工 |
| 溯源 | `/api/trace` | 原材料/成品溯源查询、扫码 |
| 设置 | `/api/settings` | 货币/税码/用户管理 |

完整 API 文档请访问 Swagger：http://localhost:3000/api/docs

---

## 目录结构

```
jiale_erp/
├── docker-compose.yml          # Docker 编排
├── .env.example                # 环境变量模板
├── package.json                # Monorepo 根配置
├── pnpm-workspace.yaml         # pnpm 工作空间
├── docs/                       # 文档
│   ├── plans/                  # 设计文档与实施计划
│   └── deployment-guide.md     # 本文档
├── packages/
│   ├── server/                 # NestJS 后端
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # 数据库模型定义
│   │   │   └── seed.ts         # 种子数据
│   │   ├── src/
│   │   │   ├── guards/         # JWT 守卫、角色守卫
│   │   │   ├── modules/
│   │   │   │   ├── auth/       # 认证模块
│   │   │   │   ├── common/     # 公共服务（编号生成）
│   │   │   │   ├── customer/   # 客户模块
│   │   │   │   ├── supplier/   # 供应商模块
│   │   │   │   ├── stock/      # 库存模块
│   │   │   │   ├── sales/      # 销售模块
│   │   │   │   ├── purchase/   # 采购模块
│   │   │   │   ├── inspection/ # 来料检验模块
│   │   │   │   ├── production/ # 生产模块
│   │   │   │   ├── trace/      # 溯源模块
│   │   │   │   ├── settings/   # 系统设置模块
│   │   │   │   └── prisma/     # Prisma 服务
│   │   │   └── main.ts         # 入口文件
│   │   └── Dockerfile
│   └── web/                    # React 前端
│       ├── src/
│       │   ├── components/     # 公共组件（QR码生成器）
│       │   ├── layouts/        # 布局（侧边栏菜单）
│       │   ├── pages/          # 页面（按模块分目录）
│       │   ├── router/         # 路由配置
│       │   ├── services/       # API 调用封装
│       │   ├── stores/         # 状态管理（认证）
│       │   └── App.tsx
│       ├── nginx.conf
│       └── Dockerfile
```
