#!/bin/bash
# ============================================================
# Jiale ERP 一键安装脚本
# 用法: curl -fsSL <url>/install.sh | bash
#   或: bash install.sh
# ============================================================

set -e

# ---- 配置 ----
INSTALL_DIR="/opt/jiale-erp"
IMAGE="asdwsxzc123/jiale-erp"
COMPOSE_URL="https://raw.githubusercontent.com/asdwsxzc123/jiale_erp/master/docker-compose.prod.yml"

# ---- 颜色输出 ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo ""
echo "========================================"
echo "  Jiale ERP 安装脚本"
echo "========================================"
echo ""

# ---- Step 1: 检查 Docker ----
info "检查系统环境..."

if ! command -v docker &> /dev/null; then
  error "未安装 Docker，请先安装: https://docs.docker.com/engine/install/"
fi

if ! docker compose version &> /dev/null; then
  error "未安装 Docker Compose V2，请升级 Docker"
fi

info "Docker $(docker --version | awk '{print $3}') ✓"
info "Docker Compose $(docker compose version --short) ✓"

# ---- Step 2: 创建安装目录 ----
info "创建安装目录: ${INSTALL_DIR}"
sudo mkdir -p "${INSTALL_DIR}"
sudo chown "$(whoami)" "${INSTALL_DIR}"
cd "${INSTALL_DIR}"

# ---- Step 3: 下载 docker-compose.prod.yml ----
if [ -f "docker-compose.yml" ]; then
  warn "docker-compose.yml 已存在，跳过下载"
else
  info "下载 docker-compose.yml..."
  curl -fsSL "${COMPOSE_URL}" -o docker-compose.yml
  info "docker-compose.yml 下载完成 ✓"
fi

# ---- Step 4: 生成环境配置 ----
if [ -f ".env.production" ]; then
  warn ".env.production 已存在，跳过生成（如需重新配置请删除后重新运行）"
else
  info "生成环境配置..."

  # 自动生成强密码和密钥
  DB_PASSWORD=$(openssl rand -hex 16)
  JWT_SECRET=$(openssl rand -hex 32)

  cat > .env.production <<EOF
# ============================================================
# Jiale ERP 生产环境配置（由安装脚本自动生成）
# ============================================================

# ---- PostgreSQL ----
POSTGRES_USER=jiale
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_DB=jiale_erp

# ---- 后端 ----
JWT_SECRET=${JWT_SECRET}
ADMIN_INIT_PASSWORD=Admin@123456
EOF

  chmod 600 .env.production
  info ".env.production 已生成 ✓"
fi

# ---- Step 5: 拉取镜像 ----
info "拉取 Docker 镜像..."
docker compose pull

# ---- Step 6: 启动服务 ----
info "启动服务..."
docker compose up -d

# ---- Step 7: 等待数据库就绪 ----
info "等待数据库就绪..."
RETRIES=30
until docker compose exec -T db pg_isready -U jiale &> /dev/null; do
  RETRIES=$((RETRIES - 1))
  if [ $RETRIES -le 0 ]; then
    error "数据库启动超时"
  fi
  sleep 2
done
info "数据库就绪 ✓"

# ---- Step 8: 初始化数据库 ----
info "执行数据库迁移..."
docker compose exec -T app npx prisma migrate deploy

info "写入种子数据..."
docker compose exec -T app npx prisma db seed

# ---- 安装完成 ----
# 读取实际端口
APP_PORT=$(grep -oP '"\K[0-9]+(?=:3100")' docker-compose.yml 2>/dev/null || echo "80")
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")

echo ""
echo "========================================"
echo -e "  ${GREEN}Jiale ERP 安装完成${NC}"
echo "========================================"
echo ""
echo "  访问地址:  http://${SERVER_IP}:${APP_PORT}"
echo "  API 文档:  http://${SERVER_IP}:${APP_PORT}/api/docs"
echo ""
echo "  默认管理员:"
echo "    用户名:  admin"
echo "    密码:    Admin@123456（请尽快修改）"
echo ""
echo "  安装目录:  ${INSTALL_DIR}"
echo "  配置文件:  ${INSTALL_DIR}/.env.production"
echo ""
echo "  常用命令:"
echo "    查看日志:  cd ${INSTALL_DIR} && docker compose logs -f"
echo "    重启服务:  cd ${INSTALL_DIR} && docker compose restart"
echo "    停止服务:  cd ${INSTALL_DIR} && docker compose down"
echo "    更新版本:  cd ${INSTALL_DIR} && docker compose pull && docker compose up -d"
echo ""
echo "========================================"
