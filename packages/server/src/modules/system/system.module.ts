import { Module } from '@nestjs/common';
import { SystemController } from './system.controller.js';

/**
 * 系统管理模块 - 提供一键升级等运维功能
 */
@Module({
  controllers: [SystemController],
})
export class SystemModule {}
