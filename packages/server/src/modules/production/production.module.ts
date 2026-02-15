import { Module } from '@nestjs/common';
import { BOMService } from './bom.service.js';
import { BOMController } from './bom.controller.js';
import { JobOrderService } from './job-order.service.js';
import { JobOrderController } from './job-order.controller.js';
import { FinishedProductController } from './finished-product.controller.js';

/**
 * 生产模块 - 包含 BOM、工单和成品管理
 */
@Module({
  controllers: [BOMController, JobOrderController, FinishedProductController],
  providers: [BOMService, JobOrderService],
  exports: [BOMService, JobOrderService],
})
export class ProductionModule {}
