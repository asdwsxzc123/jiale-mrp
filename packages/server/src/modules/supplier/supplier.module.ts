import { Module } from '@nestjs/common';
import { SupplierService } from './supplier.service.js';
import { SupplierController } from './supplier.controller.js';

/**
 * 供应商模块
 */
@Module({
  controllers: [SupplierController],
  providers: [SupplierService],
  exports: [SupplierService],
})
export class SupplierModule {}
