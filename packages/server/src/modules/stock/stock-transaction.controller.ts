import {
  Controller, Get, Post,
  Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { StockTransactionService } from './stock-transaction.service.js';
import { StockBalanceService } from './stock-balance.service.js';
import { CreateStockTransactionDto } from './dto/stock.dto.js';

/**
 * 库存事务与余额控制器
 */
@ApiTags('库存-事务')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stock')
export class StockTransactionController {
  constructor(
    private readonly transactionService: StockTransactionService,
    private readonly balanceService: StockBalanceService,
  ) {}

  /** 查询库存余额 */
  @Get('balances')
  @ApiOperation({ summary: '查询库存余额' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'itemId', required: false })
  @ApiQuery({ name: 'locationId', required: false })
  async findBalances(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('itemId') itemId?: string,
    @Query('locationId') locationId?: string,
  ) {
    return this.balanceService.findAll({
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
      itemId, locationId,
    });
  }

  /** 查询库存事务列表 */
  @Get('transactions')
  @ApiOperation({ summary: '查询库存事务列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'type', required: false })
  async findTransactions(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('type') type?: string,
  ) {
    return this.transactionService.findAll({
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
      type,
    });
  }

  /** 创建库存事务（入库/出库/调整/调拨） */
  @Post('transactions')
  @ApiOperation({ summary: '创建库存事务' })
  async createTransaction(@Body() dto: CreateStockTransactionDto, @Request() req: any) {
    return this.transactionService.create(dto, req.user?.id);
  }
}
