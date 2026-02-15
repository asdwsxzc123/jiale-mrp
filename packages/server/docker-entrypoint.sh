#!/bin/sh
set -e

cd /app/packages/server

# 每次启动：同步表结构（幂等，只应用差异）
echo "Syncing database schema..."
npx prisma db push

# 判断是否首次初始化：检查 users 表是否有数据
NEEDS_SEED=$(node prisma/check-seed.js)

if [ "$NEEDS_SEED" = "yes" ]; then
  echo "首次初始化，执行 seed..."
  npx prisma db seed
else
  echo "数据库已初始化，跳过 seed"
fi

# 启动应用（exec 替换当前进程，正确接收信号）
exec node dist/main.js
