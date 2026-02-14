/**
 * Axios 实例封装
 * - baseURL 指向 /api
 * - 请求拦截器自动添加 JWT token
 * - 响应拦截器处理 401 跳转登录
 */
import axios from 'axios';

/** 创建 Axios 实例 */
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** 请求拦截器：自动附加 JWT token */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/** 响应拦截器：处理 401 未授权跳转登录 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 清除本地存储的认证信息
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // 跳转到登录页
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
