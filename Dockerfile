# ============================================================
# Jiale ERP - 单镜像多阶段构建
# 前端编译为静态资源，由 NestJS serve-static 托管
# Build context 为项目根目录
# ============================================================

# ---- 阶段 1: 安装全量依赖（用于编译） ----
FROM node:20-alpine AS deps
WORKDIR /app

RUN npm install -g pnpm

# 拷贝 workspace 配置和 lockfile，利用 Docker 层缓存
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/server/package.json ./packages/server/package.json
COPY packages/web/package.json ./packages/web/package.json

RUN pnpm install --frozen-lockfile

# ---- 阶段 2: 编译前端 ----
FROM deps AS web-builder
WORKDIR /app

COPY packages/web ./packages/web
RUN cd packages/web && pnpm run build

# ---- 阶段 3: 编译后端 ----
FROM deps AS server-builder
WORKDIR /app

COPY packages/server ./packages/server
RUN cd packages/server && npx prisma generate && pnpm run build

# ---- 阶段 4: 生产镜像 ----
FROM node:20-alpine
WORKDIR /app

RUN npm install -g pnpm

# 拷贝 workspace 配置，安装全量依赖（prisma generate 需要 prisma CLI）
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/server/package.json ./packages/server/package.json
COPY packages/web/package.json ./packages/web/package.json

RUN pnpm install --frozen-lockfile

# 拷贝 prisma schema 并生成客户端（必须在 install 之后、dist 拷贝之前）
COPY --from=server-builder /app/packages/server/prisma ./packages/server/prisma
COPY --from=server-builder /app/packages/server/prisma.config.ts ./packages/server/prisma.config.ts
RUN cd packages/server && npx prisma generate

# 拷贝后端编译产物
COPY --from=server-builder /app/packages/server/dist ./packages/server/dist

# 拷贝前端静态资源到 server/public（与 ServeStaticModule 配置对应）
COPY --from=web-builder /app/packages/web/dist ./packages/server/public

WORKDIR /app/packages/server
EXPOSE 3100
CMD ["node", "dist/main.js"]
