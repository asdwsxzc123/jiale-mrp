import { Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

/** 导出文件存储目录 */
const EXPORT_DIR = join(process.cwd(), 'uploads', 'exports');

/**
 * 流水导出服务 - 使用 exceljs 生成 xlsx 文件
 */
@Injectable()
export class FlowExportService {
  constructor() {
    // 确保导出目录存在
    if (!existsSync(EXPORT_DIR)) {
      mkdirSync(EXPORT_DIR, { recursive: true });
    }
  }

  /** 获取导出文件的绝对路径 */
  getFilePath(filename: string): string {
    return join(EXPORT_DIR, filename);
  }

  /** 导出入库流水为 xlsx */
  async exportInbound(data: any[]): Promise<string> {
    const wb = new Workbook();
    const ws = wb.addWorksheet('入库流水');

    // 设置表头
    ws.columns = [
      { header: '日期', key: 'date', width: 14 },
      { header: '序号', key: 'serialNo', width: 12 },
      { header: '柜号/车号', key: 'containerNo', width: 20 },
      { header: '货名', key: 'itemName', width: 18 },
      { header: '提单重量', key: 'billWeight', width: 12 },
      { header: '实际重量', key: 'actualWeight', width: 12 },
      { header: '仓库位置', key: 'location', width: 12 },
      { header: '实际总重', key: 'totalWeight', width: 12 },
      { header: '备注', key: 'remark', width: 30 },
      { header: '重差', key: 'weightDiff', width: 12 },
    ];
    ws.getRow(1).font = { bold: true };

    for (const row of data) {
      ws.addRow({
        date: row.date ? new Date(row.date).toISOString().split('T')[0] : '',
        serialNo: row.serialNo ?? '',
        containerNo: row.containerNo ?? '',
        itemName: row.itemName ?? '',
        billWeight: row.billWeight ? Number(row.billWeight) : '',
        actualWeight: row.actualWeight ? Number(row.actualWeight) : '',
        location: row.location ?? '',
        totalWeight: row.totalWeight ? Number(row.totalWeight) : '',
        remark: row.remark ?? '',
        weightDiff: row.weightDiff ? Number(row.weightDiff) : '',
      });
    }

    const filename = `inbound_${Date.now()}.xlsx`;
    await wb.xlsx.writeFile(this.getFilePath(filename));
    return filename;
  }

  /** 导出出库流水为 xlsx */
  async exportOutbound(data: any[]): Promise<string> {
    const wb = new Workbook();
    const ws = wb.addWorksheet('出库流水');

    ws.columns = [
      { header: '日期', key: 'date', width: 14 },
      { header: '序号', key: 'serialNo', width: 12 },
      { header: '归属', key: 'belonging', width: 14 },
      { header: '柜号', key: 'containerNo', width: 20 },
      { header: '品名', key: 'itemName', width: 18 },
      { header: '重量', key: 'weight', width: 12 },
      { header: '包数', key: 'packageCount', width: 10 },
      { header: '总重', key: 'totalWeight', width: 12 },
      { header: '备注', key: 'remark', width: 30 },
    ];
    ws.getRow(1).font = { bold: true };

    for (const row of data) {
      ws.addRow({
        date: row.date ? new Date(row.date).toISOString().split('T')[0] : '',
        serialNo: row.serialNo ?? '',
        belonging: row.belonging ?? '',
        containerNo: row.containerNo ?? '',
        itemName: row.itemName ?? '',
        weight: row.weight ? Number(row.weight) : '',
        packageCount: row.packageCount ?? '',
        totalWeight: row.totalWeight ? Number(row.totalWeight) : '',
        remark: row.remark ?? '',
      });
    }

    const filename = `outbound_${Date.now()}.xlsx`;
    await wb.xlsx.writeFile(this.getFilePath(filename));
    return filename;
  }

  /** 导出出成率为 xlsx */
  async exportYieldRate(data: any[]): Promise<string> {
    const wb = new Workbook();
    const ws = wb.addWorksheet('出成率');

    ws.columns = [
      { header: '日期', key: 'date', width: 14 },
      { header: '货名', key: 'itemName', width: 18 },
      { header: '柜号/车号', key: 'containerNo', width: 20 },
      { header: '来货重量', key: 'incomingWeight', width: 12 },
      { header: '步骤', key: 'step', width: 14 },
      { header: '颗粒名称', key: 'pelletName', width: 14 },
      { header: '重量', key: 'weight', width: 12 },
      { header: '色母', key: 'colorMaster', width: 10 },
      { header: '太空袋', key: 'spaceBag', width: 10 },
      { header: '杂料', key: 'misc', width: 10 },
      { header: '胶头/杂料', key: 'glueHeadMisc', width: 12 },
      { header: '垃圾', key: 'waste', width: 10 },
      { header: '卡板', key: 'pallet', width: 10 },
      { header: '总重量', key: 'totalWeight', width: 12 },
      { header: '出成率', key: 'yieldRateVal', width: 10 },
      { header: '备注', key: 'remark', width: 30 },
    ];
    ws.getRow(1).font = { bold: true };

    for (const row of data) {
      ws.addRow({
        date: row.date ? new Date(row.date).toISOString().split('T')[0] : '',
        itemName: row.itemName ?? '',
        containerNo: row.containerNo ?? '',
        incomingWeight: row.incomingWeight ? Number(row.incomingWeight) : '',
        step: row.step ?? '',
        pelletName: row.pelletName ?? '',
        weight: row.weight ? Number(row.weight) : '',
        colorMaster: row.colorMaster ? Number(row.colorMaster) : '',
        spaceBag: row.spaceBag ? Number(row.spaceBag) : '',
        misc: row.misc ? Number(row.misc) : '',
        glueHeadMisc: row.glueHeadMisc ? Number(row.glueHeadMisc) : '',
        waste: row.waste ? Number(row.waste) : '',
        pallet: row.pallet ? Number(row.pallet) : '',
        totalWeight: row.totalWeight ? Number(row.totalWeight) : '',
        yieldRateVal: row.yieldRateVal ? Number(row.yieldRateVal) : '',
        remark: row.remark ?? '',
      });
    }

    const filename = `yield_rate_${Date.now()}.xlsx`;
    await wb.xlsx.writeFile(this.getFilePath(filename));
    return filename;
  }
}
