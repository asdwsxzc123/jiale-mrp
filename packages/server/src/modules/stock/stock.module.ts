import { Module } from '@nestjs/common';
import { StockItemService } from './stock-item.service.js';
import { StockItemController } from './stock-item.controller.js';
import { StockGroupController } from './stock-group.controller.js';
import { StockCategoryController } from './stock-category.controller.js';
import { StockLocationController } from './stock-location.controller.js';
import { StockBalanceService } from './stock-balance.service.js';
import { StockTransactionService } from './stock-transaction.service.js';
import { StockTransactionController } from './stock-transaction.controller.js';

/**
 * 库存模块 - 包含物料、分组、分类、仓位、余额、事务子模块
 */
@Module({
  controllers: [
    StockItemController,
    StockGroupController,
    StockCategoryController,
    StockLocationController,
    StockTransactionController,
  ],
  providers: [
    StockItemService,
    StockBalanceService,
    StockTransactionService,
  ],
  exports: [StockItemService, StockBalanceService, StockTransactionService],
})
export class StockModule {}
