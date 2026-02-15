/**
 * 生产管理 API
 */
import api from './api';

/* ---- BOM 物料清单 ---- */
export interface BOMItem {
  id?: string;
  bomId?: string;
  materialItemId: string;
  quantity: number;
  uom: string;
  isSubAssembly: boolean;
  materialItem?: { id: string; code: string; description: string };
}

export interface BOM {
  id: string;
  productItemId: string;
  version: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  items?: BOMItem[];
  productItem?: { id: string; code: string; description: string };
}

export async function getBOMs(params?: Record<string, unknown>) {
  const res = await api.get('/boms', { params });
  return res.data;
}

export async function getBOM(id: string) {
  const res = await api.get(`/boms/${id}`);
  return res.data;
}

export async function createBOM(data: Partial<BOM>) {
  const res = await api.post('/boms', data);
  return res.data;
}

export async function updateBOM(id: string, data: Partial<BOM>) {
  const res = await api.put(`/boms/${id}`, data);
  return res.data;
}

export async function deleteBOM(id: string) {
  const res = await api.delete(`/boms/${id}`);
  return res.data;
}

/* ---- 生产单 ---- */
export interface JobOrderMaterial {
  id?: string;
  jobOrderId?: string;
  materialItemId: string;
  requiredQty: number;
  issuedQty: number;
  actualUsedWeight?: number;
  uom: string;
  rawMaterialBatchId?: string;
  materialItem?: { id: string; code: string; description: string };
}

export interface JobOrder {
  id: string;
  docNo: string;
  productItemId: string;
  bomId?: string;
  plannedQty: number;
  completedQty: number;
  color?: string;
  plannedWeight?: number;
  actualWeight?: number;
  yieldRate?: number;
  productionCycle?: number;
  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  status: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  materials?: JobOrderMaterial[];
  productItem?: { id: string; code: string; description: string };
  bom?: BOM;
}

export async function getJobOrders(params?: Record<string, unknown>) {
  const res = await api.get('/job-orders', { params });
  return res.data;
}

export async function getJobOrder(id: string) {
  const res = await api.get(`/job-orders/${id}`);
  return res.data;
}

export async function createJobOrder(data: Partial<JobOrder>) {
  const res = await api.post('/job-orders', data);
  return res.data;
}

export async function updateJobOrder(id: string, data: Partial<JobOrder>) {
  const res = await api.put(`/job-orders/${id}`, data);
  return res.data;
}

export async function deleteJobOrder(id: string) {
  const res = await api.delete(`/job-orders/${id}`);
  return res.data;
}

/** 领料操作 */
export async function issueMaterial(jobOrderId: string, data: { materialId: string; qty: number; batchId?: string }) {
  const res = await api.post(`/job-orders/${jobOrderId}/issue-material`, data);
  return res.data;
}

/** 产出/完工操作 */
export async function completeJobOrder(id: string, data: { completedQty: number; actualWeight?: number }) {
  const res = await api.post(`/job-orders/${id}/complete`, data);
  return res.data;
}

/* ---- 成品管理 ---- */
export interface FinishedProductMaterial {
  id: string;
  rawMaterialBatchId: string;
  usedWeight: number;
}

export interface FinishedProduct {
  id: string;
  traceabilityCode: string;
  itemId: string;
  jobOrderId?: string;
  productionDate?: string;
  color?: string;
  weight: number;
  weightUnit: string;
  warehouseLocationId?: string;
  qrCodeData?: Record<string, unknown>;
  status: string;
  createdAt: string;
  item?: { id: string; code: string; description: string };
  jobOrder?: { id: string; docNo: string };
  warehouseLocation?: { id: string; name: string };
  materials?: FinishedProductMaterial[];
}

export async function getFinishedProducts(params?: Record<string, unknown>) {
  const res = await api.get('/finished-products', { params });
  return res.data;
}

export async function getFinishedProduct(id: string) {
  const res = await api.get(`/finished-products/${id}`);
  return res.data;
}
