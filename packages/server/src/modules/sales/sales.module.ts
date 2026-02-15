import { Module } from '@nestjs/common';
import { SalesDocumentService } from './sales-document.service.js';
import { SalesDocumentController } from './sales-document.controller.js';
import { CustomerPaymentController } from './customer-payment.controller.js';

/**
 * 销售模块 - 包含销售单据和客户收款
 */
@Module({
  controllers: [SalesDocumentController, CustomerPaymentController],
  providers: [SalesDocumentService],
  exports: [SalesDocumentService],
})
export class SalesModule {}
