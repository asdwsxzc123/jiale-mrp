import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';
import { FlowController } from './flow.controller.js';
import { FlowService } from './flow.service.js';
import { FlowExportService } from './flow-export.service.js';
import { FlowCleanupService } from './flow-cleanup.service.js';

/**
 * 流水模块 - 入库流水/出库流水/出成率管理 + Excel 导出 + 定时清理
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
    // 注入 JwtService 用于下载接口的 token 验证
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'jiale-erp-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [FlowController],
  providers: [FlowService, FlowExportService, FlowCleanupService],
})
export class FlowModule {}
