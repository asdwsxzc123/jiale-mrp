/**
 * 系统管理 API
 */
import api from './api';

/** 版本检查返回类型 */
export interface CheckUpdateResult {
  current: string;
  latest: string | null;
  hasUpdate: boolean;
  error?: string;
}

/** 获取当前系统版本 */
export async function getVersion() {
  const res = await api.get<{ version: string }>('/system/version');
  return res.data;
}

/** 检查是否有新版本 */
export async function checkUpdate() {
  const res = await api.get<CheckUpdateResult>('/system/check-update');
  return res.data;
}

/** 触发系统升级（拉取最新镜像并重启） */
export async function triggerUpgrade() {
  const res = await api.post('/system/upgrade');
  return res.data;
}

/** 健康检查（用于升级后轮询服务器是否恢复） */
export async function healthCheck() {
  const res = await api.get('/system/health');
  return res.data;
}
