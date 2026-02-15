import { Module } from '@nestjs/common';
import { PurchaseDocumentService } from './purchase-document.service.js';
import { PurchaseDocumentController } from './purchase-document.controller.js';
import { SupplierPaymentController } from './supplier-payment.controller.js';

/**
 * 采购模块 - 包含采购单据和供应商付款
 */
@Module({
  controllers: [PurchaseDocumentController, SupplierPaymentController],
  providers: [PurchaseDocumentService],
  exports: [PurchaseDocumentService],
})
export class PurchaseModule {}
