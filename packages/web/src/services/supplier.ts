/**
 * 供应商管理 API
 */
import api from './api';

/** 供应商分支类型 */
export interface SupplierBranch {
  id?: string;
  supplierId?: string;
  branchName: string;
  address1?: string;
  address2?: string;
  address3?: string;
  address4?: string;
  country?: string;
  postcode?: string;
  city?: string;
  state?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  email?: string;
}

/** 供应商类型 */
export interface Supplier {
  id: string;
  code: string;
  companyName: string;
  category?: string;
  nationality?: string;
  industriesCode?: string;
  regNo?: string;
  attention?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  email?: string;
  currency: string;
  outstandingAmount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  branches?: SupplierBranch[];
}

/** 查询供应商列表 */
export async function getSuppliers(params?: Record<string, unknown>) {
  const res = await api.get('/suppliers', { params });
  return res.data;
}

/** 获取单个供应商详情 */
export async function getSupplier(id: string) {
  const res = await api.get(`/suppliers/${id}`);
  return res.data;
}

/** 创建供应商 */
export async function createSupplier(data: Partial<Supplier>) {
  const res = await api.post('/suppliers', data);
  return res.data;
}

/** 更新供应商 */
export async function updateSupplier(id: string, data: Partial<Supplier>) {
  const res = await api.put(`/suppliers/${id}`, data);
  return res.data;
}

/** 删除供应商 */
export async function deleteSupplier(id: string) {
  const res = await api.delete(`/suppliers/${id}`);
  return res.data;
}
