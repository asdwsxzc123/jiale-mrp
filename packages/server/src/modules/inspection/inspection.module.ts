import { Module } from '@nestjs/common';
import { InspectionService } from './inspection.service.js';
import { InspectionController } from './inspection.controller.js';

/**
 * 来料检验模块
 */
@Module({
  controllers: [InspectionController],
  providers: [InspectionService],
  exports: [InspectionService],
})
export class InspectionModule {}
