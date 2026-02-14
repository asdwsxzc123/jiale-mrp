import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './modules/prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CommonModule } from './modules/common/common.module.js';
import { CustomerModule } from './modules/customer/customer.module.js';
import { SupplierModule } from './modules/supplier/supplier.module.js';
import { StockModule } from './modules/stock/stock.module.js';
import { SalesModule } from './modules/sales/sales.module.js';
import { PurchaseModule } from './modules/purchase/purchase.module.js';
import { InspectionModule } from './modules/inspection/inspection.module.js';
import { ProductionModule } from './modules/production/production.module.js';
import { TraceModule } from './modules/trace/trace.module.js';
import { SettingsModule } from './modules/settings/settings.module.js';

/**
 * 根模块 - 导入所有业务模块
 */
@Module({
  imports: [
    // 基础设施模块
    PrismaModule,     // 数据库访问（全局）
    CommonModule,     // 公共服务（全局）
    AuthModule,       // JWT 认证

    // 业务模块
    CustomerModule,   // 客户管理
    SupplierModule,   // 供应商管理
    StockModule,      // 库存管理
    SalesModule,      // 销售管理
    PurchaseModule,   // 采购管理
    InspectionModule, // 来料检验
    ProductionModule, // 生产管理
    TraceModule,      // 溯源查询

    // 系统设置
    SettingsModule,   // 货币、税码、用户管理
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
