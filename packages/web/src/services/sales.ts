/**
 * 销售管理 API
 */
import api from './api';

/** 销售单据行项目类型 */
export interface SalesDocumentItem {
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
}

/** 销售单据类型 */
export interface SalesDocument {
  id: string;
  type: string;
  docNo: string;
  customerId: string;
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
  depositAmount: number;
  outstanding: number;
  status: string;
  eInvoiceStatus?: string;
  isTransferable: boolean;
  refDocId?: string;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; code: string; companyName: string };
  items?: SalesDocumentItem[];
}

/** 查询销售单据列表 */
export async function getSalesDocuments(params?: Record<string, unknown>) {
  const res = await api.get('/sales-documents', { params });
  return res.data;
}

/** 获取单个销售单据 */
export async function getSalesDocument(id: string) {
  const res = await api.get(`/sales-documents/${id}`);
  return res.data;
}

/** 创建销售单据 */
export async function createSalesDocument(data: Partial<SalesDocument>) {
  const res = await api.post('/sales-documents', data);
  return res.data;
}

/** 更新销售单据 */
export async function updateSalesDocument(id: string, data: Partial<SalesDocument>) {
  const res = await api.put(`/sales-documents/${id}`, data);
  return res.data;
}

/** 删除销售单据 */
export async function deleteSalesDocument(id: string) {
  const res = await api.delete(`/sales-documents/${id}`);
  return res.data;
}

/* ---- 客户付款 ---- */
export interface CustomerPayment {
  id: string;
  customerId: string;
  docNo: string;
  date: string;
  amount: number;
  currency: string;
  method?: string;
  refNo?: string;
  notes?: string;
  createdAt: string;
  customer?: { id: string; code: string; companyName: string };
}

export async function getCustomerPayments(params?: Record<string, unknown>) {
  const res = await api.get('/customer-payments', { params });
  return res.data;
}

export async function getCustomerPayment(id: string) {
  const res = await api.get(`/customer-payments/${id}`);
  return res.data;
}

export async function createCustomerPayment(data: Partial<CustomerPayment>) {
  const res = await api.post('/customer-payments', data);
  return res.data;
}

export async function updateCustomerPayment(id: string, data: Partial<CustomerPayment>) {
  const res = await api.put(`/customer-payments/${id}`, data);
  return res.data;
}

export async function deleteCustomerPayment(id: string) {
  const res = await api.delete(`/customer-payments/${id}`);
  return res.data;
}
