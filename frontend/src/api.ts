import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { z } from 'zod';
import { Category, MenuItem, Order, OrderItem, CategorySchema, MenuItemSchema, OrderSchema, OrderItemSchema, PaginatedResponseSchema } from './types';

const API_BASE_URL = '/api';

// Auto-detect K8s preview proxy and rewrite API URLs
const isProxied = window.location.pathname.includes('/preview/proxy');
const proxyBase = isProxied
  ? window.location.pathname.replace(/\/preview\/proxy.*/, '/preview/proxy')
  : '';

const api: AxiosInstance = axios.create({
  baseURL: proxyBase + API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Auth interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// On a 401 with a stored refresh token (the Express track issues one), refresh once and retry.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const refreshToken = localStorage.getItem('refreshToken');
    if (error.response?.status === 401 && refreshToken && original && !original._retried) {
      original._retried = true;
      try {
        const res = await axios.post(proxyBase + API_BASE_URL + '/auth/refresh/', { refreshToken });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        return api(original);
      } catch {
        localStorage.removeItem('refreshToken');
      }
    }
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      localStorage.removeItem('token');
      if (originalRequest.method === 'get') {
        originalRequest._retry = true;
        delete originalRequest.headers.Authorization;
        return api(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);

// Response validation is advisory: a schema mismatch must never blank a page.
const parseOr = <S extends z.ZodTypeAny>(schema: S, data: unknown): z.output<S> => {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.warn('[api] response did not match schema, using raw data:', result.error.issues.slice(0, 3));
    return data as z.output<S>;
  }
  return result.data;
};

// Auth API
export const login = (credentials: { username: string; password: string }) =>
  api.post('/auth/login/', credentials);
export const register = (data: { username: string; email: string; password: string }) =>
  api.post('/auth/register/', data);
export const logout = () => api.post('/auth/logout/');
export const getProfile = () => api.get('/auth/profile/');

// ── Category API ──
export const getCategoryList = async (params?: Record<string, unknown>): Promise<Category[]> => {
  const res = await api.get('/categories/', params ? { params } : undefined);
  const data = Array.isArray(res.data) ? res.data : (res.data?.results ?? res.data?.data ?? res.data?.items ?? res.data?.categories ?? res.data?.categories ?? []);
  // The interface is the strict type: a field name the API does not send is a compile error, not an unknown.
  return parseOr(z.array(CategorySchema), data) as Category[];
};

export const getCategory = async (id: number | string | Record<string, unknown>): Promise<Category> => {
  // Pages sometimes call the detail getter with a filter object; route that to the list endpoint.
  if (typeof id === 'object' && id !== null) return getCategoryList(id) as unknown as Promise<Category>;
  const res = await api.get(`/categories/${id}/`);
  return parseOr(CategorySchema, res.data) as Category;
};

// Create sends the fields a form holds; the server sets owner, status, totals and times, and validates.
export const createCategory = async (data: Partial<Omit<Category, 'id'>>): Promise<Category> => {
  const res = await api.post('/categories/', data);
  return parseOr(CategorySchema, res.data) as Category;
};

export const updateCategory = async (id: number, data: Partial<Category>): Promise<Category> => {
  const res = await api.patch(`/categories/${id}/`, data);
  return parseOr(CategorySchema, res.data) as Category;
};

export const deleteCategory = async (id: number) => {
  await api.delete(`/categories/${id}/`);
};

// ── MenuItem API ──
export const getMenuItemList = async (params?: Record<string, unknown>): Promise<MenuItem[]> => {
  const res = await api.get('/menu-items/', params ? { params } : undefined);
  const data = Array.isArray(res.data) ? res.data : (res.data?.results ?? res.data?.data ?? res.data?.items ?? res.data?.menu_items ?? res.data?.menuItems ?? []);
  // The interface is the strict type: a field name the API does not send is a compile error, not an unknown.
  return parseOr(z.array(MenuItemSchema), data) as MenuItem[];
};

export const getMenuItem = async (id: number | string | Record<string, unknown>): Promise<MenuItem> => {
  // Pages sometimes call the detail getter with a filter object; route that to the list endpoint.
  if (typeof id === 'object' && id !== null) return getMenuItemList(id) as unknown as Promise<MenuItem>;
  const res = await api.get(`/menu-items/${id}/`);
  return parseOr(MenuItemSchema, res.data) as MenuItem;
};

// Create sends the fields a form holds; the server sets owner, status, totals and times, and validates.
export const createMenuItem = async (data: Partial<Omit<MenuItem, 'id'>>): Promise<MenuItem> => {
  const res = await api.post('/menu-items/', data);
  return parseOr(MenuItemSchema, res.data) as MenuItem;
};

export const updateMenuItem = async (id: number, data: Partial<MenuItem>): Promise<MenuItem> => {
  const res = await api.patch(`/menu-items/${id}/`, data);
  return parseOr(MenuItemSchema, res.data) as MenuItem;
};

export const deleteMenuItem = async (id: number) => {
  await api.delete(`/menu-items/${id}/`);
};

// ── Order API ──
export const getOrderList = async (params?: Record<string, unknown>): Promise<Order[]> => {
  const res = await api.get('/orders/', params ? { params } : undefined);
  const data = Array.isArray(res.data) ? res.data : (res.data?.results ?? res.data?.data ?? res.data?.items ?? res.data?.orders ?? res.data?.orders ?? []);
  // The interface is the strict type: a field name the API does not send is a compile error, not an unknown.
  return parseOr(z.array(OrderSchema), data) as Order[];
};

export const getOrder = async (id: number | string | Record<string, unknown>): Promise<Order> => {
  // Pages sometimes call the detail getter with a filter object; route that to the list endpoint.
  if (typeof id === 'object' && id !== null) return getOrderList(id) as unknown as Promise<Order>;
  const res = await api.get(`/orders/${id}/`);
  return parseOr(OrderSchema, res.data) as Order;
};

// Create sends the fields a form holds; the server sets owner, status, totals and times, and validates.
export const createOrder = async (data: Partial<Omit<Order, 'id'>>): Promise<Order> => {
  const res = await api.post('/orders/', data);
  return parseOr(OrderSchema, res.data) as Order;
};

export const updateOrder = async (id: number, data: Partial<Order>): Promise<Order> => {
  const res = await api.patch(`/orders/${id}/`, data);
  return parseOr(OrderSchema, res.data) as Order;
};

export const deleteOrder = async (id: number) => {
  await api.delete(`/orders/${id}/`);
};

// ── OrderItem API ──
export const getOrderItemList = async (params?: Record<string, unknown>): Promise<OrderItem[]> => {
  const res = await api.get('/order-items/', params ? { params } : undefined);
  const data = Array.isArray(res.data) ? res.data : (res.data?.results ?? res.data?.data ?? res.data?.items ?? res.data?.order_items ?? res.data?.orderItems ?? []);
  // The interface is the strict type: a field name the API does not send is a compile error, not an unknown.
  return parseOr(z.array(OrderItemSchema), data) as OrderItem[];
};

export const getOrderItem = async (id: number | string | Record<string, unknown>): Promise<OrderItem> => {
  // Pages sometimes call the detail getter with a filter object; route that to the list endpoint.
  if (typeof id === 'object' && id !== null) return getOrderItemList(id) as unknown as Promise<OrderItem>;
  const res = await api.get(`/order-items/${id}/`);
  return parseOr(OrderItemSchema, res.data) as OrderItem;
};

// Create sends the fields a form holds; the server sets owner, status, totals and times, and validates.
export const createOrderItem = async (data: Partial<Omit<OrderItem, 'id'>>): Promise<OrderItem> => {
  const res = await api.post('/order-items/', data);
  return parseOr(OrderItemSchema, res.data) as OrderItem;
};

export const updateOrderItem = async (id: number, data: Partial<OrderItem>): Promise<OrderItem> => {
  const res = await api.patch(`/order-items/${id}/`, data);
  return parseOr(OrderItemSchema, res.data) as OrderItem;
};

export const deleteOrderItem = async (id: number) => {
  await api.delete(`/order-items/${id}/`);
};


// Auth aliases — domain agents use varied naming conventions
export const loginUser = (email: string, password: string) => api.post('/auth/login/', { username: email, password });
export const registerUser = (userData: any) => api.post('/auth/register/', userData);
export const getCurrentUser = getProfile;
export const updateUserProfile = (data: Partial<any>) => api.patch('/auth/profile/', data);

export { api };
export default api;
