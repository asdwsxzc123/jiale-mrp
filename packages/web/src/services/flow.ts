/**
 * 流水管理 API - 入库流水/出库流水/出成率
 */
import api from './api';

// ==================== 类型定义 ====================

/** 通用筛选参数 */
export interface FlowQuery {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  stockItemId?: string;
  page?: number;
  pageSize?: number;
}

/** 入库流水 */
export interface InboundFlow {
  id: string;
  date: string;
  serialNo?: string;
  containerNo?: string;
  itemName: string;
  billWeight?: number;
  actualWeight?: number;
  location?: string;
  totalWeight?: number;
  remark?: string;
  weightDiff?: number;
  customerId?: string;
  stockItemId?: string;
  customer?: { id: string; companyName: string };
  stockItem?: { id: string; description: string };
}

/** 出库流水 */
export interface OutboundFlow {
  id: string;
  date: string;
  serialNo?: string;
  belonging?: string;
  containerNo?: string;
  itemName: string;
  weight?: number;
  packageCount?: number;
  totalWeight?: number;
  remark?: string;
  customerId?: string;
  stockItemId?: string;
  customer?: { id: string; companyName: string };
  stockItem?: { id: string; description: string };
}

/** 出成率 */
export interface YieldRate {
  id: string;
  date: string;
  itemName: string;
  containerNo?: string;
  incomingWeight?: number;
  step?: string;
  pelletName?: string;
  weight?: number;
  colorMaster?: number;
  spaceBag?: number;
  misc?: number;
  glueHeadMisc?: number;
  waste?: number;
  pallet?: number;
  totalWeight?: number;
  yieldRateVal?: number;
  remark?: string;
  customerId?: string;
  stockItemId?: string;
  customer?: { id: string; companyName: string };
  stockItem?: { id: string; description: string };
}

// ==================== 入库流水 API ====================

export async function getInboundFlows(params?: FlowQuery) {
  const res = await api.get('/flow/inbound', { params });
  return res.data;
}

export async function createInboundFlow(data: Partial<InboundFlow>) {
  const res = await api.post('/flow/inbound', data);
  return res.data;
}

export async function deleteInboundFlow(id: string) {
  const res = await api.delete(`/flow/inbound/${id}`);
  return res.data;
}

export async function exportInboundFlow(params?: FlowQuery) {
  const res = await api.post('/flow/inbound/export', params);
  return res.data;
}

// ==================== 出库流水 API ====================

export async function getOutboundFlows(params?: FlowQuery) {
  const res = await api.get('/flow/outbound', { params });
  return res.data;
}

export async function createOutboundFlow(data: Partial<OutboundFlow>) {
  const res = await api.post('/flow/outbound', data);
  return res.data;
}

export async function deleteOutboundFlow(id: string) {
  const res = await api.delete(`/flow/outbound/${id}`);
  return res.data;
}

export async function exportOutboundFlow(params?: FlowQuery) {
  const res = await api.post('/flow/outbound/export', params);
  return res.data;
}

// ==================== 出成率 API ====================

export async function getYieldRates(params?: FlowQuery) {
  const res = await api.get('/flow/yield-rate', { params });
  return res.data;
}

export async function createYieldRate(data: Partial<YieldRate>) {
  const res = await api.post('/flow/yield-rate', data);
  return res.data;
}

export async function deleteYieldRate(id: string) {
  const res = await api.delete(`/flow/yield-rate/${id}`);
  return res.data;
}

export async function exportYieldRate(params?: FlowQuery) {
  const res = await api.post('/flow/yield-rate/export', params);
  return res.data;
}

// ==================== 文件下载 ====================

/**
 * 下载导出的 Excel 文件
 * 通过创建隐藏 <a> 标签触发浏览器下载
 */
export function downloadExportFile(filename: string) {
  const link = document.createElement('a');
  link.href = `/api/flow/download/${filename}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
