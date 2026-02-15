/**
 * 来料检验 API
 */
import api from './api';

/** 来料检验类型 */
export interface IncomingInspection {
  id: string;
  purchaseDocId: string;
  purchaseDocItemId?: string;
  itemId: string;
  supplierId: string;
  inspectionDate: string;
  wrongItem: boolean;
  wrongItemDescription?: string;
  weightDifference?: number;
  handlingMethod?: string;
  handlingNotes?: string;
  inspectorId?: string;
  status: string;
  createdAt: string;
  supplier?: { id: string; code: string; companyName: string };
}

/** 查询检验列表 */
export async function getInspections(params?: Record<string, unknown>) {
  const res = await api.get('/inspections', { params });
  return res.data;
}

/** 获取单个检验详情 */
export async function getInspection(id: string) {
  const res = await api.get(`/inspections/${id}`);
  return res.data;
}

/** 创建检验记录 */
export async function createInspection(data: Partial<IncomingInspection>) {
  const res = await api.post('/inspections', data);
  return res.data;
}

/** 更新检验记录 */
export async function updateInspection(id: string, data: Partial<IncomingInspection>) {
  const res = await api.put(`/inspections/${id}`, data);
  return res.data;
}

/** 标记检验通过 */
export async function passInspection(id: string) {
  const res = await api.post(`/inspections/${id}/pass`);
  return res.data;
}

/** 标记检验不合格 */
export async function rejectInspection(id: string, data: { handlingMethod: string; handlingNotes?: string }) {
  const res = await api.post(`/inspections/${id}/reject`, data);
  return res.data;
}
