/**
 * 库存管理 API
 */
import api from './api';

/* ---- 物料 ---- */
export interface StockItemUOM {
  id?: string;
  itemId?: string;
  uom: string;
  rate: number;
  refCost: number;
  refPrice: number;
  isBase: boolean;
}

export interface StockItem {
  id: string;
  code: string;
  description: string;
  groupId?: string;
  categoryId?: string;
  baseUom: string;
  reorderLevel: number;
  reorderQty: number;
  leadTime: number;
  refCost: number;
  refPrice: number;
  barcode?: string;
  shelf?: string;
  outputTaxRate: number;
  inputTaxRate: number;
  stockControl: boolean;
  serialNoTracking: boolean;
  isActive: boolean;
  uoms?: StockItemUOM[];
  group?: { id: string; name: string };
  category?: { id: string; name: string };
}

export async function getStockItems(params?: Record<string, unknown>) {
  const res = await api.get('/stock/items', { params });
  return res.data;
}

export async function getStockItem(id: string) {
  const res = await api.get(`/stock-items/${id}`);
  return res.data;
}

export async function createStockItem(data: Partial<StockItem>) {
  const res = await api.post('/stock/items', data);
  return res.data;
}

export async function updateStockItem(id: string, data: Partial<StockItem>) {
  const res = await api.put(`/stock-items/${id}`, data);
  return res.data;
}

export async function deleteStockItem(id: string) {
  const res = await api.delete(`/stock-items/${id}`);
  return res.data;
}

/* ---- 物料组 ---- */
export interface StockGroup {
  id: string;
  name: string;
  description?: string;
}

export async function getStockGroups(params?: Record<string, unknown>) {
  const res = await api.get('/stock/groups', { params });
  return res.data;
}

export async function createStockGroup(data: Partial<StockGroup>) {
  const res = await api.post('/stock/groups', data);
  return res.data;
}

export async function updateStockGroup(id: string, data: Partial<StockGroup>) {
  const res = await api.put(`/stock-groups/${id}`, data);
  return res.data;
}

export async function deleteStockGroup(id: string) {
  const res = await api.delete(`/stock-groups/${id}`);
  return res.data;
}

/* ---- 物料分类 ---- */
export interface StockCategory {
  id: string;
  name: string;
  description?: string;
}

export async function getStockCategories(params?: Record<string, unknown>) {
  const res = await api.get('/stock/categories', { params });
  return res.data;
}

export async function createStockCategory(data: Partial<StockCategory>) {
  const res = await api.post('/stock/categories', data);
  return res.data;
}

export async function updateStockCategory(id: string, data: Partial<StockCategory>) {
  const res = await api.put(`/stock-categories/${id}`, data);
  return res.data;
}

export async function deleteStockCategory(id: string) {
  const res = await api.delete(`/stock-categories/${id}`);
  return res.data;
}

/* ---- 仓库 ---- */
export interface StockLocation {
  id: string;
  name: string;
  description?: string;
}

export async function getStockLocations(params?: Record<string, unknown>) {
  const res = await api.get('/stock/locations', { params });
  return res.data;
}

export async function createStockLocation(data: Partial<StockLocation>) {
  const res = await api.post('/stock/locations', data);
  return res.data;
}

export async function updateStockLocation(id: string, data: Partial<StockLocation>) {
  const res = await api.put(`/stock-locations/${id}`, data);
  return res.data;
}

export async function deleteStockLocation(id: string) {
  const res = await api.delete(`/stock-locations/${id}`);
  return res.data;
}

/* ---- 库存余额 ---- */
export interface StockBalance {
  id: string;
  itemId: string;
  locationId: string;
  quantity: number;
  reservedQty: number;
  item?: StockItem;
  location?: StockLocation;
}

export async function getStockBalances(params?: Record<string, unknown>) {
  const res = await api.get('/stock/balances', { params });
  return res.data;
}

/* ---- 库存操作 ---- */
export interface StockTransactionItem {
  id?: string;
  itemId: string;
  qty: number;
  uom: string;
  unitCost: number;
  notes?: string;
}

export interface StockTransaction {
  id: string;
  type: string;
  docNo: string;
  date: string;
  locationFromId?: string;
  locationToId?: string;
  refDocumentType?: string;
  refDocumentId?: string;
  createdBy?: string;
  createdAt: string;
  items?: StockTransactionItem[];
}

export async function getStockTransactions(params?: Record<string, unknown>) {
  const res = await api.get('/stock/transactions', { params });
  return res.data;
}

export async function getStockTransaction(id: string) {
  const res = await api.get(`/stock-transactions/${id}`);
  return res.data;
}

export async function createStockTransaction(data: Partial<StockTransaction>) {
  const res = await api.post('/stock/transactions', data);
  return res.data;
}
