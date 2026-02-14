import { Module } from '@nestjs/common';
import { CurrencyController } from './currency.controller.js';
import { TaxCodeController } from './tax-code.controller.js';
import { UserController } from './user.controller.js';

/**
 * 系统设置模块 - 包含货币、税码、用户管理
 */
@Module({
  controllers: [CurrencyController, TaxCodeController, UserController],
})
export class SettingsModule {}
