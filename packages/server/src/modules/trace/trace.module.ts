import { Module } from '@nestjs/common';
import { TraceService } from './trace.service.js';
import { TraceController } from './trace.controller.js';

/**
 * 溯源模块
 */
@Module({
  controllers: [TraceController],
  providers: [TraceService],
  exports: [TraceService],
})
export class TraceModule {}
