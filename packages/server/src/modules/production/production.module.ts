import { Module } from '@nestjs/common';
import { BOMService } from './bom.service.js';
import { BOMController } from './bom.controller.js';
import { JobOrderService } from './job-order.service.js';
import { JobOrderController } from './job-order.controller.js';

/**
 * 生产模块 - 包含 BOM 和工单管理
 */
@Module({
  controllers: [BOMController, JobOrderController],
  providers: [BOMService, JobOrderService],
  exports: [BOMService, JobOrderService],
})
export class ProductionModule {}
