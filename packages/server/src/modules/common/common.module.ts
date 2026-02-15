import { Global, Module } from '@nestjs/common';
import { DocNumberService } from './doc-number.service.js';

/**
 * 公共模块 - 提供单据编号生成等公共服务
 */
@Global()
@Module({
  providers: [DocNumberService],
  exports: [DocNumberService],
})
export class CommonModule {}
