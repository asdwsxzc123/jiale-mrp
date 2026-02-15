#!/bin/bash
# ============================================================
# Jiale ERP 部署脚本
# 功能: 构建 Docker 镜像并推送到 Docker Hub
# 用法: ./deploy.sh [版本号]
#   例: ./deploy.sh          -> 使用 latest 标签
#       ./deploy.sh v1.0.0   -> 使用 v1.0.0 + latest 标签
# ============================================================

set -e

# ---- 配置 ----
DOCKER_USER="asdwsxzc123"
PROJECT="jiale-erp"
SERVER_IMAGE="${DOCKER_USER}/${PROJECT}-server"
WEB_IMAGE="${DOCKER_USER}/${PROJECT}-web"
TAG="${1:-latest}"

# 项目根目录
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "========================================"
echo " Jiale ERP 部署"
echo " Server: ${SERVER_IMAGE}:${TAG}"
echo " Web:    ${WEB_IMAGE}:${TAG}"
echo "========================================"

# ---- Step 1: 确认 Docker 已登录 ----
echo ""
echo "[1/4] 检查 Docker Hub 登录状态..."
if ! docker info 2>/dev/null | grep -q "Username"; then
  echo "  请先登录 Docker Hub:"
  docker login
fi
echo "  ✓ Docker 已登录"

# ---- Step 2: 构建镜像（context 为项目根目录） ----
echo ""
echo "[2/4] 构建 Docker 镜像..."

echo "  → 构建 server 镜像..."
docker build \
  -t "${SERVER_IMAGE}:${TAG}" \
  -t "${SERVER_IMAGE}:latest" \
  -f "${ROOT_DIR}/packages/server/Dockerfile" \
  "${ROOT_DIR}"

echo "  → 构建 web 镜像..."
docker build \
  -t "${WEB_IMAGE}:${TAG}" \
  -t "${WEB_IMAGE}:latest" \
  -f "${ROOT_DIR}/packages/web/Dockerfile" \
  "${ROOT_DIR}"

echo "  ✓ 镜像构建完成"

# ---- Step 3: 推送到 Docker Hub ----
echo ""
echo "[3/4] 推送镜像到 Docker Hub..."

docker push "${SERVER_IMAGE}:${TAG}"
docker push "${SERVER_IMAGE}:latest"
docker push "${WEB_IMAGE}:${TAG}"
docker push "${WEB_IMAGE}:latest"

echo "  ✓ 镜像推送完成"

# ---- Step 4: 输出远程部署指引 ----
echo ""
echo "[4/4] 推送成功！"
echo ""
echo "========================================"
echo " 远程服务器部署步骤:"
echo "========================================"
echo ""
echo " 1. 将以下文件上传到服务器:"
echo "    - docker-compose.prod.yml"
echo "    - .env.production (基于 .env.production.example 修改)"
echo ""
echo " 2. 在服务器上执行:"
echo "    docker compose -f docker-compose.prod.yml pull"
echo "    docker compose -f docker-compose.prod.yml up -d"
echo ""
echo " 3. 首次部署需要初始化数据库:"
echo "    docker compose -f docker-compose.prod.yml exec server npx prisma migrate deploy"
echo "    docker compose -f docker-compose.prod.yml exec server npx prisma db seed"
echo ""
echo "========================================"
