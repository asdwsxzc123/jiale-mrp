import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { TraceService } from './trace.service.js';

/**
 * 溯源控制器 - 根据溯源码追溯原材料和成品
 */
@ApiTags('溯源查询')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trace')
export class TraceController {
  constructor(private readonly traceService: TraceService) {}

  /** 查询原材料批次溯源 */
  @Get('raw-material/:code')
  @ApiOperation({ summary: '查询原材料批次溯源信息' })
  async traceRawMaterial(@Param('code') code: string) {
    return this.traceService.traceRawMaterial(code);
  }

  /** 查询成品溯源 */
  @Get('finished-product/:code')
  @ApiOperation({ summary: '查询成品溯源信息' })
  async traceFinishedProduct(@Param('code') code: string) {
    return this.traceService.traceFinishedProduct(code);
  }

  /** 扫码自动识别（RM- 或 FP- 前缀） */
  @Get('scan/:code')
  @ApiOperation({ summary: '扫码溯源（自动识别 RM-/FP- 前缀）' })
  async scan(@Param('code') code: string) {
    return this.traceService.scan(code);
  }
}
