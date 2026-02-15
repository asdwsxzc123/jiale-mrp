#!/bin/sh
set -e

cd /app/packages/server

# 每次启动：同步表结构（幂等，只应用差异）
echo "Syncing database schema..."
npx prisma db push --skip-generate

# 判断是否首次初始化：用 pg 直接查 users 表行数
NEEDS_SEED=$(node -e "
  const pg = require('pg');
  const c = new pg.Client(process.env.DATABASE_URL);
  c.connect()
    .then(() => c.query('SELECT COUNT(*) FROM users'))
    .then(r => { console.log(r.rows[0].count === '0' ? 'yes' : 'no'); c.end(); })
    .catch(() => { console.log('yes'); c.end(); });
")

if [ "$NEEDS_SEED" = "yes" ]; then
  echo "首次初始化，执行 seed..."
  npx prisma db seed
else
  echo "数据库已初始化，跳过 seed"
fi

# 启动应用（exec 替换当前进程，正确接收信号）
exec node dist/main.js
