# Jiale ERP

嘉乐 ERP 系统 — 面向制造业的物料需求计划（MRP）管理平台。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Ant Design Pro + Vite |
| 后端 | NestJS 11 + Prisma ORM + PostgreSQL 16 |
| 部署 | Docker Compose + 单镜像多阶段构建 |

## 功能模块

- **客户管理** — 客户档案、分支地址、付款/存款/借记贷记单
- **供应商管理** — 供应商档案、分支地址、付款/存款/借记贷记单
- **库存管理** — 物料主数据、库存分组/分类、仓库管理、库存事务与余额
- **采购管理** — 采购申请、采购订单、收货、采购发票、现金采购、退货
- **销售管理** — 报价单、销售订单、送货单、销售发票、现金销售
- **生产管理** — BOM 物料清单、生产工单、成品管理、物料领用
- **来料检验** — 质量检验、缺陷处理（退回/补货/让步接收/报废）
- **追溯管理** — 原材料批次追溯、成品追溯、QR 码扫描
- **系统设置** — 用户管理（4 级角色）、币种配置、税码管理

## 项目结构

```
jiale_erp/
├── packages/
│   ├── server/          # NestJS 后端
│   │   ├── src/modules/ # 业务模块
│   │   ├── prisma/      # 数据库 Schema & 迁移
│   │   └── dist/        # 编译产物
│   └── web/             # React 前端
│       ├── src/pages/   # 页面组件
│       ├── src/services/# API 调用层
│       └── dist/        # 构建产物
├── docker-compose.yml       # 开发环境
├── docker-compose.prod.yml  # 生产环境
├── Dockerfile               # 多阶段构建
├── install.sh               # 一键安装脚本
└── docs/                    # 文档
```

## 快速开始

### 前置条件

- Node.js >= 20
- pnpm >= 9
- PostgreSQL 16（或使用 Docker）

### 本地开发

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，填写数据库密码和 JWT 密钥

# 3. 初始化数据库
cd packages/server
npx prisma migrate dev
npx prisma db seed

# 4. 启动开发服务
cd ../..
pnpm dev
```

启动后访问：

- 前端：http://localhost:5188
- API：http://localhost:3100/api
- Swagger 文档：http://localhost:3100/api/docs

默认管理员账号：`admin` / `Admin@123456`

### Docker 开发

```bash
cp .env.example .env
# 编辑 .env，填写数据库密码和 JWT 密钥

docker compose up -d
```

## 生产部署

### 一键安装（推荐）

```bash
curl -fsSL https://raw.githubusercontent.com/asdwsxzc123/jiale-mrp/master/install.sh | bash
```

脚本会自动完成：检查/安装 Docker、生成环境配置、拉取镜像、启动服务、执行数据库迁移和种子数据。

### 手动部署

```bash
mkdir -p ~/jiale_erp && cd ~/jiale_erp

# 下载配置
curl -fsSL https://raw.githubusercontent.com/asdwsxzc123/jiale-mrp/master/docker-compose.prod.yml -o docker-compose.yml

# 创建环境配置
cat > .env <<EOF
POSTGRES_USER=jiale
POSTGRES_PASSWORD=你的强密码
POSTGRES_DB=jiale_erp
JWT_SECRET=你的随机密钥
ADMIN_INIT_PASSWORD=Admin@123456
EOF

# 启动
docker compose pull
docker compose up -d

# 初始化数据库
docker compose exec -T app npx prisma migrate deploy
docker compose exec -T app npx prisma db seed
```

## 常用命令

```bash
# 查看日志
docker compose logs -f

# 重启服务
docker compose restart

# 更新版本
docker compose pull && docker compose up -d

# 数据库迁移（开发）
cd packages/server && npx prisma migrate dev

# 数据库 GUI
cd packages/server && npx prisma studio
```

## 环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `POSTGRES_USER` | 数据库用户名 | `jiale` |
| `POSTGRES_PASSWORD` | 数据库密码 | - |
| `POSTGRES_DB` | 数据库名 | `jiale_erp` |
| `JWT_SECRET` | JWT 签名密钥 | 64 位随机字符串 |
| `ADMIN_INIT_PASSWORD` | 管理员初始密码 | `Admin@123456` |

## 用户角色

| 角色 | 说明 |
|------|------|
| `ADMIN` | 管理员，全部权限 |
| `MANAGER` | 经理，业务管理权限 |
| `OPERATOR` | 操作员，日常操作权限 |
| `VIEWER` | 查看者，只读权限 |

## License

Private

## 删除容器和启动部分容器

```
       #直接指定服务名启动 db 就行
docker compose up -d db

⏺ 因为 docker-compose.yml 里数据库用了 named volume：

  volumes:
    - pgdata:/var/lib/postgresql/data

  删除容器不会删除 volume，数据会一直保留。

  # 查看 volume
  docker volume ls | grep pgdata

  # 要彻底清除数据，需要显式删除 volume
  docker compose down -v


```
