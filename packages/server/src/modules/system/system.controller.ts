import {
  Controller, Get, Post, UseGuards, Logger, HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { exec } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { RolesGuard } from '../../guards/roles.guard.js';
import { Roles } from '../../guards/roles.decorator.js';

/** compose 文件路径（挂载到容器内的 /deploy 目录） */
const COMPOSE_FILE = '/deploy/docker-compose.prod.yml';

/** Docker Hub 镜像名（用于查询远端版本） */
const DOCKER_IMAGE = process.env.DOCKER_IMAGE || 'asdwsxzc123/jiale-erp';

/** 读取 package.json 中的当前版本号 */
function getCurrentVersion(): string {
  try {
    const pkgPath = join(__dirname, '..', '..', '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

/**
 * 查询 Docker Hub tags API，获取最新版本号
 * 接口：GET https://hub.docker.com/v2/repositories/{image}/tags?page_size=100&ordering=-name
 * 从返回的 tag 列表中筛选 semver 格式的标签，取最大值
 */
async function fetchLatestVersion(): Promise<string | null> {
  try {
    const url = `https://hub.docker.com/v2/repositories/${DOCKER_IMAGE}/tags?page_size=100&ordering=-name`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const semverRegex = /^\d+\.\d+\.\d+$/;

    // 筛选 semver 格式的 tag，按版本号降序排列
    const versions = (data.results || [])
      .map((t: { name: string }) => t.name)
      .filter((name: string) => semverRegex.test(name))
      .sort((a: string, b: string) => {
        const pa = a.split('.').map(Number);
        const pb = b.split('.').map(Number);
        for (let i = 0; i < 3; i++) {
          if (pa[i] !== pb[i]) return pb[i] - pa[i];
        }
        return 0;
      });

    return versions[0] || null;
  } catch {
    return null;
  }
}

/**
 * 系统管理控制器 - 提供版本检测和一键升级功能
 * 仅管理员可访问
 */
@ApiTags('系统管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('system')
export class SystemController {
  private readonly logger = new Logger(SystemController.name);

  /** 健康检查 - 用于升级后前端轮询判断服务是否恢复 */
  @Get('health')
  @ApiOperation({ summary: '健康检查' })
  health() {
    return { status: 'ok' };
  }

  /** 获取当前版本号 */
  @Get('version')
  @ApiOperation({ summary: '获取当前系统版本' })
  version() {
    return { version: getCurrentVersion() };
  }

  /**
   * 检查更新 - 对比当前版本与 Docker Hub 上的最新版本
   * 返回当前版本、最新版本、是否有更新
   */
  @Get('check-update')
  @ApiOperation({ summary: '检查是否有新版本' })
  async checkUpdate() {
    const current = getCurrentVersion();
    const latest = await fetchLatestVersion();

    // 无法获取远端版本时，返回未知状态
    if (!latest) {
      return { current, latest: null, hasUpdate: false, error: '无法连接 Docker Hub' };
    }

    // 比较版本号：latest > current 则有更新
    const hasUpdate = this.compareVersions(latest, current) > 0;
    return { current, latest, hasUpdate };
  }

  /**
   * 一键升级：拉取最新镜像并重启应用容器
   *
   * 执行流程：
   * 1. docker compose pull app - 拉取最新镜像
   * 2. docker compose up -d app - 用新镜像重建容器
   *
   * 注意：容器重建后当前进程会被终止，HTTP 响应可能中断（前端需轮询恢复）
   */
  @Post('upgrade')
  @HttpCode(200)
  @ApiOperation({ summary: '一键升级系统（仅管理员）' })
  async upgrade() {
    this.logger.log('收到升级请求，开始拉取最新镜像...');

    // 先返回响应，再异步执行升级（避免响应被容器重启打断）
    setImmediate(() => {
      const cmd = [
        `docker compose -f ${COMPOSE_FILE} pull app`,
        `docker compose -f ${COMPOSE_FILE} up -d app`,
      ].join(' && ');

      this.logger.log(`执行升级命令: ${cmd}`);

      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          this.logger.error(`升级失败: ${error.message}`);
          this.logger.error(`stderr: ${stderr}`);
          return;
        }
        this.logger.log(`升级输出: ${stdout}`);
      });
    });

    return { message: '升级已触发，系统将在数秒后重启' };
  }

  /** 比较两个 semver 版本号，返回 1 / 0 / -1 */
  private compareVersions(a: string, b: string): number {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if (pa[i] > pb[i]) return 1;
      if (pa[i] < pb[i]) return -1;
    }
    return 0;
  }
}
