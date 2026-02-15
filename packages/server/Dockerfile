# ============================================================
# Jiale ERP Server - 多阶段构建
# Build context 必须为项目根目录
# ============================================================

# ---- 阶段 1: 安装依赖并编译 ----
FROM node:20-alpine AS builder
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 先拷贝 workspace 配置和 lockfile，利用 Docker 缓存
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/server/package.json ./packages/server/package.json
COPY packages/web/package.json ./packages/web/package.json

# 只安装 server 的依赖（包含 devDependencies 用于编译）
RUN pnpm install --frozen-lockfile

# 拷贝 server 源码和 Prisma schema
COPY packages/server ./packages/server

# 生成 Prisma Client 并编译 TypeScript
RUN cd packages/server && npx prisma generate && pnpm run build

# ---- 阶段 2: 生产镜像 ----
FROM node:20-alpine
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 拷贝 workspace 配置
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/server/package.json ./packages/server/package.json
COPY packages/web/package.json ./packages/web/package.json

# 只安装生产依赖
RUN pnpm install --frozen-lockfile --prod

# 从 builder 拷贝编译产物和 Prisma 文件
COPY --from=builder /app/packages/server/dist ./packages/server/dist
COPY --from=builder /app/packages/server/prisma ./packages/server/prisma
COPY --from=builder /app/packages/server/prisma.config.ts ./packages/server/prisma.config.ts

# 拷贝生成的 Prisma Client
COPY --from=builder /app/node_modules/.pnpm/@prisma+client*/node_modules/@prisma/client ./node_modules/.pnpm/@prisma+client/node_modules/@prisma/client

WORKDIR /app/packages/server
EXPOSE 3100
CMD ["node", "dist/main.js"]
