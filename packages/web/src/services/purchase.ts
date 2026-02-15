/**
 * 采购管理 API
 */
import api from './api';

/** 采购单据行项目类型 */
export interface PurchaseDocumentItem {
  id?: string;
  documentId?: string;
  itemId?: string;
  description?: string;
  qty: number;
  uom?: string;
  unitPrice: number;
  discount: number;
  subtotal: number;
  taxCode?: string;
  taxRate: number;
  taxInclusive: boolean;
  taxAmount: number;
  total: number;
  /* 采购特有字段 */
  plannedWeight?: number;
  actualWeight?: number;
  plannedArrivalDate?: string;
  actualArrivalDate?: string;
  paymentMethod?: string;
  weightUnit?: string;
}

/** 采购单据类型 */
export interface PurchaseDocument {
  id: string;
  type: string;
  docNo: string;
  supplierId: string;
  branchId?: string;
  date: string;
  agent?: string;
  terms?: string;
  description?: string;
  project?: string;
  refNo?: string;
  extNo?: string;
  currency: string;
  exchangeRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  outstanding: number;
  status: string;
  isTransferable: boolean;
  isCancelled: boolean;
  refDocId?: string;
  createdAt: string;
  updatedAt: string;
  supplier?: { id: string; code: string; companyName: string };
  items?: PurchaseDocumentItem[];
}

/** 查询采购单据列表 */
export async function getPurchaseDocuments(params?: Record<string, unknown>) {
  const res = await api.get('/purchase/documents', { params });
  return res.data;
}

/** 获取单个采购单据 */
export async function getPurchaseDocument(id: string) {
  const res = await api.get(`/purchase-documents/${id}`);
  return res.data;
}

/** 创建采购单据 */
export async function createPurchaseDocument(data: Partial<PurchaseDocument>) {
  const res = await api.post('/purchase/documents', data);
  return res.data;
}

/** 更新采购单据 */
export async function updatePurchaseDocument(id: string, data: Partial<PurchaseDocument>) {
  const res = await api.put(`/purchase-documents/${id}`, data);
  return res.data;
}

/** 删除采购单据 */
export async function deletePurchaseDocument(id: string) {
  const res = await api.delete(`/purchase-documents/${id}`);
  return res.data;
}

/* ---- 供应商付款 ---- */
export interface SupplierPayment {
  id: string;
  supplierId: string;
  docNo: string;
  date: string;
  amount: number;
  currency: string;
  method?: string;
  refNo?: string;
  notes?: string;
  createdAt: string;
  supplier?: { id: string; code: string; companyName: string };
}

export async function getSupplierPayments(params?: Record<string, unknown>) {
  const res = await api.get('/purchase/payments', { params });
  return res.data;
}

export async function getSupplierPayment(id: string) {
  const res = await api.get(`/supplier-payments/${id}`);
  return res.data;
}

export async function createSupplierPayment(data: Partial<SupplierPayment>) {
  const res = await api.post('/purchase/payments', data);
  return res.data;
}

export async function updateSupplierPayment(id: string, data: Partial<SupplierPayment>) {
  const res = await api.put(`/supplier-payments/${id}`, data);
  return res.data;
}

export async function deleteSupplierPayment(id: string) {
  const res = await api.delete(`/supplier-payments/${id}`);
  return res.data;
}
