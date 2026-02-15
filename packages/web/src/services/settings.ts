/**
 * 系统设置 API
 */
import api from './api';

/* ---- 货币 ---- */
export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isBase: boolean;
}

export async function getCurrencies() {
  const res = await api.get('/currencies');
  return res.data;
}

export async function createCurrency(data: Partial<Currency>) {
  const res = await api.post('/currencies', data);
  return res.data;
}

export async function updateCurrency(id: string, data: Partial<Currency>) {
  const res = await api.put(`/currencies/${id}`, data);
  return res.data;
}

export async function deleteCurrency(id: string) {
  const res = await api.delete(`/currencies/${id}`);
  return res.data;
}

/* ---- 税码 ---- */
export interface TaxCode {
  id: string;
  code: string;
  description?: string;
  rate: number;
}

export async function getTaxCodes() {
  const res = await api.get('/tax-codes');
  return res.data;
}

export async function createTaxCode(data: Partial<TaxCode>) {
  const res = await api.post('/tax-codes', data);
  return res.data;
}

export async function updateTaxCode(id: string, data: Partial<TaxCode>) {
  const res = await api.put(`/tax-codes/${id}`, data);
  return res.data;
}

export async function deleteTaxCode(id: string) {
  const res = await api.delete(`/tax-codes/${id}`);
  return res.data;
}

/* ---- 用户管理 ---- */
export interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export async function getUsers(params?: Record<string, unknown>) {
  const res = await api.get('/users', { params });
  return res.data;
}

export async function createUser(data: { username: string; password: string; name: string; role: string }) {
  const res = await api.post('/users', data);
  return res.data;
}

export async function updateUser(id: string, data: Partial<User & { password?: string }>) {
  const res = await api.put(`/users/${id}`, data);
  return res.data;
}

export async function deleteUser(id: string) {
  const res = await api.delete(`/users/${id}`);
  return res.data;
}
