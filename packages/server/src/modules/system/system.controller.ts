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

/** GitHub 仓库（用于查询 Release 版本） */
const GITHUB_REPO = process.env.GITHUB_REPO || 'asdwsxzc123/jiale-mrp';

/** Docker 镜像全名 */
const DOCKER_IMAGE = process.env.DOCKER_IMAGE || 'asdwsxzc123/jiale-erp';

/** 版本缓存（避免频繁请求 GitHub API） */
let versionCache: { latest: string; checkedAt: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 分钟

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

/** 封装 exec 为 Promise */
function run(cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout: 15000 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve(stdout.trim());
    });
  });
}

/** 比较两个 semver 版本号，返回 1 / 0 / -1 */
function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/, '').split('.').map(Number);
  const pb = b.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
  }
  return 0;
}

/**
 * 方案 1：通过 GitHub Release API 获取最新版本号
 * 容器内网络可能不通，所以走 Docker 宿主机网络执行 curl
 */
async function fetchLatestFromGitHub(): Promise<string | null> {
  // 命中缓存
  if (versionCache && Date.now() - versionCache.checkedAt < CACHE_TTL) {
    return versionCache.latest;
  }

  try {
    // 通过 docker run --network host 走宿主机网络，绕过容器网络限制
    const url = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
    const raw = await run(
      `docker run --rm --network host node:20-alpine node -e "fetch('${url}',{headers:{'User-Agent':'jiale-erp'}}).then(r=>r.json()).then(d=>console.log(d.tag_name||''))"`,
    );
    const tag = raw.trim();
    if (!tag) return null;

    // 去掉 v 前缀
    const version = tag.replace(/^v/, '');
    versionCache = { latest: version, checkedAt: Date.now() };
    return version;
  } catch {
    return null;
  }
}

/**
 * 方案 2（降级）：通过 Docker CLI 对比本地与远端镜像 digest
 * 无法获取版本号，只能判断有无更新
 */
async function checkRemoteDigest(): Promise<{ hasUpdate: boolean; error?: string }> {
  const image = `${DOCKER_IMAGE}:latest`;

  try {
    // 获取本地镜像 digest
    const localRepoDigest = await run(
      `docker image inspect ${image} --format '{{index .RepoDigests 0}}'`,
    );
    const localDigest = localRepoDigest.split('@')[1] || '';

    // 获取远端 manifest digest（不拉取镜像，只查询元数据）
    const manifestRaw = await run(`docker manifest inspect ${image} 2>/dev/null`);
    const manifest = JSON.parse(manifestRaw);

    if (manifest.config?.digest) {
      // 单架构 manifest
      return { hasUpdate: manifest.config.digest !== localDigest };
    } else if (manifest.manifests?.length) {
      // 多架构 manifest list
      const digests = manifest.manifests.map((m: { digest: string }) => m.digest);
      return { hasUpdate: !digests.some((d: string) => d === localDigest) };
    }

    return { hasUpdate: false };
  } catch (e) {
    return { hasUpdate: false, error: (e as Error).message };
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
   * 检查更新
   * 优先通过 GitHub Release API 获取最新版本号
   * 降级方案：Docker CLI 对比镜像 digest
   */
  @Get('check-update')
  @ApiOperation({ summary: '检查是否有新版本' })
  async checkUpdate() {
    const current = getCurrentVersion();

    // 方案 1：GitHub Release API（能拿到版本号）
    const latest = await fetchLatestFromGitHub();
    if (latest) {
      const hasUpdate = compareVersions(latest, current) > 0;
      return { current, latest, hasUpdate };
    }

    // 方案 2：Docker digest 对比（降级，只能判断有无更新）
    this.logger.warn('GitHub API 不可用，降级为 Docker digest 对比');
    const digestResult = await checkRemoteDigest();

    if (digestResult.error) {
      this.logger.warn(`digest 对比也失败: ${digestResult.error}`);
      return { current, latest: null, hasUpdate: false, error: '无法检查更新' };
    }

    return { current, latest: null, hasUpdate: digestResult.hasUpdate };
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
}
