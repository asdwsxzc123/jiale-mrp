#!/bin/bash
# ============================================================
# Jiale ERP 一键安装脚本
# 用法: curl -fsSL <url>/install.sh | bash
#   或: bash install.sh
# 支持: 首次安装 / 更新升级（自动识别）
# ============================================================

set -e

# ---- 配置 ----
INSTALL_DIR="$HOME/jiale_erp"
COMPOSE_URL="https://raw.githubusercontent.com/asdwsxzc123/jiale-mrp/master/docker-compose.prod.yml"
DB_USER="jiale"
DB_NAME="jiale_erp"

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

# 如果未安装 Docker，从 Docker 官方源安装（支持 Debian/Ubuntu）
if ! command -v docker &> /dev/null; then
  info "未检测到 Docker，从官方源安装..."

  # 安装前置依赖
  sudo apt-get update
  sudo apt-get install -y ca-certificates curl gnupg

  # 添加 Docker 官方 GPG 密钥
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg

  # 检测发行版（debian 或 ubuntu），设置对应的 apt 源
  # 用 grep 读取，避免 source 在 curl|bash 管道下失败
  OS_ID=$(grep -oP '^ID=\K\w+' /etc/os-release)
  OS_CODENAME=$(grep -oP '^VERSION_CODENAME=\K\w+' /etc/os-release)

  if [ "$OS_ID" = "ubuntu" ]; then
    DOCKER_REPO="https://download.docker.com/linux/ubuntu"
  else
    DOCKER_REPO="https://download.docker.com/linux/debian"
  fi

  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] ${DOCKER_REPO} ${OS_CODENAME} stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

  # 安装 Docker Engine + Compose 插件
  sudo apt-get update
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

  # 启动 Docker 服务
  sudo systemctl enable docker
  sudo systemctl start docker

  info "Docker 安装完成 ✓"
fi

# 验证 Docker 守护进程可达（权限检查）
if ! docker info &> /dev/null; then
  error "无法连接 Docker，请确认当前用户在 docker 组中（sudo usermod -aG docker \$USER）或使用 sudo 运行"
fi

# 验证 Docker Compose 可用
if ! docker compose version &> /dev/null; then
  error "Docker Compose 不可用，请检查安装"
fi

info "Docker $(docker --version | awk '{print $3}') ✓"
info "Docker Compose $(docker compose version --short) ✓"

# ---- Step 2: 创建安装目录及数据目录 ----
info "创建安装目录: ${INSTALL_DIR}"
mkdir -p "${INSTALL_DIR}/data"
cd "${INSTALL_DIR}"

# ---- Step 3: 判断首次安装还是更新 ----
# 通过 data 目录是否有 PG 数据文件来判断
IS_FIRST_INSTALL=true
if [ -d "data/base" ]; then
  IS_FIRST_INSTALL=false
  info "检测到已有数据库数据，进入更新模式"
fi

# ---- Step 4: 停止旧容器（更新模式） ----
if [ "$IS_FIRST_INSTALL" = false ] && [ -f "docker-compose.yml" ]; then
  info "停止旧服务..."
  docker compose down 2>/dev/null || true
fi

# ---- Step 5: 下载 docker-compose.yml ----
# 每次都更新 compose 文件，确保配置最新
info "下载 docker-compose.yml..."
curl -fsSL "${COMPOSE_URL}" -o docker-compose.yml.tmp
mv docker-compose.yml.tmp docker-compose.yml
info "docker-compose.yml 已更新 ✓"

# ---- Step 6: 生成环境配置 ----
if [ -f ".env" ]; then
  warn ".env 已存在，跳过生成（如需重新配置请删除后重新运行）"
else
  info "生成环境配置..."

  # 自动生成强密码和密钥
  DB_PASSWORD=$(openssl rand -hex 16)
  JWT_SECRET=$(openssl rand -hex 32)

  cat > .env <<EOF
# ============================================================
# Jiale ERP 生产环境配置（由安装脚本自动生成）
# ============================================================

# ---- 运行环境 ----
NODE_ENV=production

# ---- PostgreSQL ----
POSTGRES_USER=${DB_USER}
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_DB=${DB_NAME}

# ---- 数据库连接（容器内使用） ----
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}

# ---- 后端 ----
JWT_SECRET=${JWT_SECRET}
ADMIN_INIT_PASSWORD=Admin@123456
EOF

  chmod 600 .env
  info ".env 已生成 ✓"
fi

# ---- Step 7: 拉取镜像并启动 ----
info "拉取 Docker 镜像..."
docker compose pull

info "启动服务..."
docker compose up -d

# ---- Step 8: 等待数据库就绪 ----
info "等待数据库就绪..."
RETRIES=30
until docker compose exec -T db pg_isready -U "${DB_USER}" &> /dev/null; do
  RETRIES=$((RETRIES - 1))
  if [ $RETRIES -le 0 ]; then
    error "数据库启动超时"
  fi
  sleep 2
done
info "数据库就绪 ✓"

# ---- Step 9: 等待应用容器就绪 ----
info "等待应用容器就绪..."
RETRIES=30
until docker compose exec -T app echo "ready" &> /dev/null; do
  RETRIES=$((RETRIES - 1))
  if [ $RETRIES -le 0 ]; then
    error "应用容器启动超时，请检查日志: docker compose logs app"
  fi
  sleep 2
done
info "应用容器就绪 ✓"

# ---- Step 10: 初始化数据库 ----
info "执行数据库迁移..."
docker compose exec -T app npx prisma migrate deploy

# 仅首次安装时写入种子数据，避免重复执行
if [ "$IS_FIRST_INSTALL" = true ]; then
  info "写入种子数据..."
  docker compose exec -T app npx prisma db seed
else
  info "更新模式，跳过种子数据 ✓"
fi

# ---- 安装完成 ----
# 读取实际映射端口
APP_PORT=$(grep -oP '"\K[0-9]+(?=:3100")' docker-compose.yml 2>/dev/null || echo "80")
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")

echo ""
echo "========================================"
if [ "$IS_FIRST_INSTALL" = true ]; then
  echo -e "  ${GREEN}Jiale ERP 安装完成${NC}"
else
  echo -e "  ${GREEN}Jiale ERP 更新完成${NC}"
fi
echo "========================================"
echo ""
echo "  访问地址:  http://${SERVER_IP}:${APP_PORT}"
echo "  API 文档:  http://${SERVER_IP}:${APP_PORT}/api/docs"
echo ""
if [ "$IS_FIRST_INSTALL" = true ]; then
  echo "  默认管理员:"
  echo "    用户名:  admin"
  echo "    密码:    Admin@123456（请尽快修改）"
  echo ""
fi
echo "  安装目录:  ${INSTALL_DIR}"
echo "  配置文件:  ${INSTALL_DIR}/.env"
echo "  数据目录:  ${INSTALL_DIR}/data"
echo ""
echo "  常用命令:"
echo "    查看日志:  cd ${INSTALL_DIR} && docker compose logs -f"
echo "    重启服务:  cd ${INSTALL_DIR} && docker compose restart"
echo "    停止服务:  cd ${INSTALL_DIR} && docker compose down"
echo "    更新版本:  cd ${INSTALL_DIR} && docker compose pull && docker compose up -d"
echo ""
echo "========================================"
