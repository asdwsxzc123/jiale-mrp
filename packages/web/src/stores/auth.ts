/**
 * 认证状态管理
 * 使用 localStorage 存储 token 和用户信息
 * 提供 login / logout / getToken / getUser 方法
 */

/** 用户信息类型 */
export interface UserInfo {
  id: string;
  username: string;
  name: string;
  role: string;
}

/** 登录响应类型 */
export interface LoginResponse {
  access_token: string;
  user: UserInfo;
}

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

/** 保存登录信息到 localStorage */
export function login(data: LoginResponse): void {
  localStorage.setItem(TOKEN_KEY, data.access_token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

/** 清除登录信息 */
export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/** 获取当前 JWT token */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/** 获取当前登录用户信息 */
export function getUser(): UserInfo | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserInfo;
  } catch {
    return null;
  }
}

/** 判断是否已登录 */
export function isAuthenticated(): boolean {
  return !!getToken();
}
