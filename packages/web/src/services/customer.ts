/**
 * 客户管理 API
 */
import api from './api';

/** 客户分支类型 */
export interface CustomerBranch {
  id?: string;
  customerId?: string;
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

/** 客户类型 */
export interface Customer {
  id: string;
  code: string;
  companyName: string;
  category?: string;
  nationality?: string;
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
  branches?: CustomerBranch[];
}

/** 查询客户列表 */
export async function getCustomers(params?: Record<string, unknown>) {
  const res = await api.get('/customers', { params });
  return res.data;
}

/** 获取单个客户详情 */
export async function getCustomer(id: string) {
  const res = await api.get(`/customers/${id}`);
  return res.data;
}

/** 创建客户 */
export async function createCustomer(data: Partial<Customer>) {
  const res = await api.post('/customers', data);
  return res.data;
}

/** 更新客户 */
export async function updateCustomer(id: string, data: Partial<Customer>) {
  const res = await api.put(`/customers/${id}`, data);
  return res.data;
}

/** 删除客户 */
export async function deleteCustomer(id: string) {
  const res = await api.delete(`/customers/${id}`);
  return res.data;
}
