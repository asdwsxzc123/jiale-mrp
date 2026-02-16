import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { join } from 'path';
import { readdirSync, statSync, unlinkSync, existsSync } from 'fs';

/** 导出文件存储目录 */
const EXPORT_DIR = join(process.cwd(), 'uploads', 'exports');
/** 文件保留时长：2 天（毫秒） */
const MAX_AGE_MS = 2 * 24 * 60 * 60 * 1000;

/**
 * 导出文件定时清理服务
 * 每天凌晨 3 点扫描 uploads/exports/，删除超过 2 天的文件
 */
@Injectable()
export class FlowCleanupService {
  private readonly logger = new Logger(FlowCleanupService.name);

  @Cron('0 3 * * *')
  handleCleanup() {
    if (!existsSync(EXPORT_DIR)) return;

    const now = Date.now();
    const files = readdirSync(EXPORT_DIR);
    let deletedCount = 0;

    for (const file of files) {
      const filePath = join(EXPORT_DIR, file);
      try {
        const stat = statSync(filePath);
        if (now - stat.mtimeMs > MAX_AGE_MS) {
          unlinkSync(filePath);
          deletedCount++;
        }
      } catch (err) {
        this.logger.warn(`清理文件失败: ${filePath}`, err);
      }
    }

    if (deletedCount > 0) {
      this.logger.log(`定时清理完成，删除了 ${deletedCount} 个过期导出文件`);
    }
  }
}
