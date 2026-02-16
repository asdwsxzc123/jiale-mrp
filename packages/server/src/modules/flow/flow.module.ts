import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { FlowController } from './flow.controller.js';
import { FlowService } from './flow.service.js';
import { FlowExportService } from './flow-export.service.js';
import { FlowCleanupService } from './flow-cleanup.service.js';

/**
 * 流水模块 - 入库流水/出库流水/出成率管理 + Excel 导出 + 定时清理
 */
@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [FlowController],
  providers: [FlowService, FlowExportService, FlowCleanupService],
})
export class FlowModule {}
