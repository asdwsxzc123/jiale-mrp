import dotenv from "dotenv";
import path from "path";
import { defineConfig } from "prisma/config";

// 加载 .env 文件：优先当前目录，其次项目根目录（兼容 Docker 和本地开发）
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
