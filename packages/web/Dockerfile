# ============================================================
# Jiale ERP Web - 多阶段构建
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

# 安装依赖
RUN pnpm install --frozen-lockfile

# 拷贝 web 源码
COPY packages/web ./packages/web

# 编译前端
RUN cd packages/web && pnpm run build

# ---- 阶段 2: Nginx 生产镜像 ----
FROM nginx:alpine

# 拷贝编译产物到 Nginx 静态文件目录
COPY --from=builder /app/packages/web/dist /usr/share/nginx/html

# 拷贝 Nginx 配置
COPY packages/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
