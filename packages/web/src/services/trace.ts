/**
 * 溯源查询 API
 */
import api from './api';

/** 溯源结果类型 */
export interface TraceResultData {
  traceabilityCode: string;
  type: 'raw_material' | 'finished_product';
  item?: { id: string; code: string; description: string };
  /* 原材料批次信息 */
  rawMaterial?: {
    id: string;
    traceabilityCode: string;
    weight: number;
    weightUnit: string;
    remainingWeight: number;
    status: string;
    receivedDate: string;
    supplier?: { id: string; code: string; companyName: string };
    purchaseDoc?: { id: string; docNo: string };
    inspection?: { id: string; status: string };
  };
  /* 成品信息 */
  finishedProduct?: {
    id: string;
    traceabilityCode: string;
    weight: number;
    weightUnit: string;
    productionDate?: string;
    color?: string;
    status: string;
    jobOrder?: { id: string; docNo: string };
    materials?: Array<{
      rawMaterialBatchId: string;
      usedWeight: number;
      batch?: {
        traceabilityCode: string;
        item?: { code: string; description: string };
        supplier?: { companyName: string };
      };
    }>;
  };
}

/** 根据溯源码查询 */
export async function traceByCode(code: string) {
  const res = await api.get(`/trace/scan/${code}`);
  return res.data as TraceResultData;
}

/** 原材料批次类型 */
export interface RawMaterialBatch {
  id: string;
  traceabilityCode: string;
  itemId: string;
  purchaseDocId?: string;
  inspectionId?: string;
  supplierId?: string;
  weight: number;
  weightUnit: string;
  warehouseLocationId?: string;
  receivedDate: string;
  remainingWeight: number;
  status: string;
  createdAt: string;
  item?: { id: string; code: string; description: string };
  supplier?: { id: string; code: string; companyName: string };
  warehouseLocation?: { id: string; name: string };
}

/** 查询原材料批次列表 */
export async function getRawMaterialBatches(params?: Record<string, unknown>) {
  const res = await api.get('/trace/raw-material-batches', { params });
  return res.data;
}

/** 获取单个原材料批次详情 */
export async function getRawMaterialBatch(id: string) {
  const res = await api.get(`/raw-material-batches/${id}`);
  return res.data;
}
