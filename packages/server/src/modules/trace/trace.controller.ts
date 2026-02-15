import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
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

  /** 分页查询原材料批次列表 */
  @Get('raw-material-batches')
  @ApiOperation({ summary: '查询原材料批次列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'supplierId', required: false })
  @ApiQuery({ name: 'itemId', required: false })
  async findAllBatches(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('supplierId') supplierId?: string,
    @Query('itemId') itemId?: string,
  ) {
    return this.traceService.findAllBatches({
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
      status, supplierId, itemId,
    });
  }

  /** 查询原材料批次详情 */
  @Get('raw-material-batches/:id')
  @ApiOperation({ summary: '查询原材料批次详情' })
  async findOneBatch(@Param('id') id: string) {
    return this.traceService.findOneBatch(id);
  }

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
