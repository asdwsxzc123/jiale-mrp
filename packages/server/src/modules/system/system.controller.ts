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

/** Docker 镜像全名 */
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

/** 封装 exec 为 Promise */
function run(cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve(stdout.trim());
    });
  });
}

/**
 * 通过 Docker CLI 对比本地与远端镜像 digest，判断是否有更新
 * Docker CLI 走宿主机 Docker daemon 网络，不受容器网络限制
 */
async function checkRemoteDigest(): Promise<{ hasUpdate: boolean; error?: string }> {
  const image = `${DOCKER_IMAGE}:latest`;

  try {
    // 获取本地镜像 digest（格式：repo@sha256:xxx）
    const localRepoDigest = await run(
      `docker image inspect ${image} --format '{{index .RepoDigests 0}}'`,
    );
    // 提取 sha256 部分
    const localDigest = localRepoDigest.split('@')[1] || '';

    // 获取远端 manifest digest（不会拉取镜像，只查询元数据）
    const manifestRaw = await run(`docker manifest inspect ${image} 2>/dev/null`);
    const manifest = JSON.parse(manifestRaw);

    // manifest list 格式（多架构）或单架构格式
    // 取 config.digest 或 manifests[0].digest 都可以用于对比
    let remoteDigest = '';
    if (manifest.config?.digest) {
      // 单架构 manifest
      remoteDigest = manifest.config.digest;
    } else if (manifest.manifests?.length) {
      // 多架构 manifest list - 取整体 digest 无法直接比，改为对比完整 manifest 内容
      // 如果本地 digest 不在 manifests 的任何一项中，说明有更新
      const manifestDigests = manifest.manifests.map((m: { digest: string }) => m.digest);
      const hasMatch = manifestDigests.some((d: string) => d === localDigest);
      return { hasUpdate: !hasMatch };
    }

    return { hasUpdate: remoteDigest !== '' && remoteDigest !== localDigest };
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
   * 检查更新 - 通过 Docker CLI 对比本地和远端镜像 digest
   * 返回当前版本、是否有更新
   */
  @Get('check-update')
  @ApiOperation({ summary: '检查是否有新版本' })
  async checkUpdate() {
    const current = getCurrentVersion();
    const result = await checkRemoteDigest();

    if (result.error) {
      this.logger.warn(`检查更新失败: ${result.error}`);
      return { current, latest: null, hasUpdate: false, error: '无法检查远端镜像' };
    }

    return { current, latest: null, hasUpdate: result.hasUpdate };
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
