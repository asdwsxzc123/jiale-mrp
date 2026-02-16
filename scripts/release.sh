#!/bin/bash
# ============================================================
# 发版脚本 - 自动 bump 版本、提交、打 tag、推送
#
# 用法:
#   ./scripts/release.sh patch   # 0.0.1 -> 0.0.2
#   ./scripts/release.sh minor   # 0.0.1 -> 0.1.0
#   ./scripts/release.sh major   # 0.0.1 -> 1.0.0
#   ./scripts/release.sh 2.1.0   # 直接指定版本号
# ============================================================
set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# 读取当前版本
PKG_FILE="packages/server/package.json"
CURRENT=$(node -p "require('./$PKG_FILE').version")
echo "当前版本: v${CURRENT}"

# 解析参数
BUMP_TYPE="${1:-patch}"

if [[ "$BUMP_TYPE" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  # 直接指定版本号
  NEW_VERSION="$BUMP_TYPE"
else
  # 根据 bump 类型计算新版本
  IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"
  case "$BUMP_TYPE" in
    major) NEW_VERSION="$((MAJOR + 1)).0.0" ;;
    minor) NEW_VERSION="${MAJOR}.$((MINOR + 1)).0" ;;
    patch) NEW_VERSION="${MAJOR}.${MINOR}.$((PATCH + 1))" ;;
    *)
      echo -e "${RED}无效参数: $BUMP_TYPE${NC}"
      echo "用法: $0 [patch|minor|major|x.y.z]"
      exit 1
      ;;
  esac
fi

echo -e "新版本: ${GREEN}v${NEW_VERSION}${NC}"
echo ""

# 确认
read -p "确认发版 v${NEW_VERSION}? (y/N) " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo "已取消"
  exit 0
fi

# 1. 更新 package.json 版本号
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('$PKG_FILE', 'utf-8'));
pkg.version = '$NEW_VERSION';
fs.writeFileSync('$PKG_FILE', JSON.stringify(pkg, null, 2) + '\n');
"
echo "✓ 更新 $PKG_FILE -> $NEW_VERSION"

# 2. 提交
git add "$PKG_FILE"
git commit -m "release: v${NEW_VERSION}"
echo "✓ 提交完成"

# 3. 打 tag
git tag "v${NEW_VERSION}"
echo "✓ 创建 tag v${NEW_VERSION}"

# 4. 推送
git push && git push --tags
echo "✓ 推送完成"

echo ""
echo -e "${GREEN}发版成功! v${NEW_VERSION}${NC}"
echo "GitHub Actions 将自动构建 Docker 镜像并创建 Release"
