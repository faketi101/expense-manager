import {
  BaseType,
  Source,
  Category,
  Transaction,
  StatsResponse,
  User,
} from '../types';

const API_BASE = '/api';

// Token Management
export const getToken = (): string | null => {
  return localStorage.getItem('expense_token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('expense_token', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('expense_token');
};

// API Loading Notification System
type ApiLoadingListener = (activeCount: number, isLoading: boolean) => void;
const apiLoadingListeners = new Set<ApiLoadingListener>();
let activeRequestsCount = 0;

export const subscribeToApiLoading = (listener: ApiLoadingListener): (() => void) => {
  apiLoadingListeners.add(listener);
  listener(activeRequestsCount, activeRequestsCount > 0);
  return () => {
    apiLoadingListeners.delete(listener);
  };
};

export const getActiveRequestsCount = (): number => activeRequestsCount;

const notifyListeners = () => {
  const isLoading = activeRequestsCount > 0;
  apiLoadingListeners.forEach((listener) => {
    try {
      listener(activeRequestsCount, isLoading);
    } catch (err) {
      console.error('Error in API loading listener:', err);
    }
  });
};

// Helper for fetch with Authorization
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  activeRequestsCount++;
  notifyListeners();

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    return await response.json();
  } finally {
    activeRequestsCount = Math.max(0, activeRequestsCount - 1);
    notifyListeners();
  }
}

export const api = {
  // Authentication
  register: (data: { name: string; email: string; password: string; currency?: string }) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => request<{ user: User }>('/auth/me'),

  updatePreferences: (data: {
    currency?: string;
    hideBalances?: boolean;
    defaultScope?: string;
    scopeBarOrder?: 'default_first' | 'all_first';
  }) =>
    request<{ user: User }>('/auth/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Base Types (Scopes)
  getBaseTypes: () => request<BaseType[]>('/base-types'),
  createBaseType: (data: Partial<BaseType>) =>
    request<BaseType>('/base-types', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateBaseType: (id: string, data: Partial<BaseType>) =>
    request<BaseType>(`/base-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteBaseType: (id: string, force: boolean = false) =>
    request<{ message: string; id: string }>(`/base-types/${id}${force ? '?force=true' : ''}`, {
      method: 'DELETE',
    }),

  // Sources (Accounts with Scope Allocations)
  getSources: (baseTypeId?: string, includeHidden: boolean = false) => {
    const params = new URLSearchParams();
    if (baseTypeId) params.append('baseTypeId', baseTypeId);
    if (includeHidden) params.append('includeHidden', 'true');
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<Source[]>(`/sources${query}`);
  },
  createSource: (data: Partial<Source>) =>
    request<Source>('/sources', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSource: (id: string, data: Partial<Source>) =>
    request<Source>(`/sources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteSource: (id: string, force: boolean = false) =>
    request<{ message: string; id: string }>(`/sources/${id}${force ? '?force=true' : ''}`, {
      method: 'DELETE',
    }),
  reorderSources: (orderedIds: string[]) =>
    request<{ message: string }>('/sources/reorder', {
      method: 'PUT',
      body: JSON.stringify({ orderedIds }),
    }),

  // Categories & Subcategories
  getCategories: (params?: { type?: string; baseTypeId?: string; includeHidden?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.append('type', params.type);
    if (params?.baseTypeId) searchParams.append('baseTypeId', params.baseTypeId);
    if (params?.includeHidden) searchParams.append('includeHidden', 'true');
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<Category[]>(`/categories${query}`);
  },
  createCategory: (data: Partial<Category>) =>
    request<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCategory: (id: string, data: Partial<Category>) =>
    request<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  addSubcategory: (categoryId: string, data: { name: string; icon?: string; color?: string }) =>
    request<Category>(`/categories/${categoryId}/subcategories`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteSubcategory: (categoryId: string, subId: string) =>
    request<Category>(`/categories/${categoryId}/subcategories/${subId}`, {
      method: 'DELETE',
    }),
  deleteCategory: (id: string, force: boolean = false) =>
    request<{ message: string; id: string }>(`/categories/${id}${force ? '?force=true' : ''}`, {
      method: 'DELETE',
    }),

  // Transactions
  getTransactions: (filters?: {
    baseTypeId?: string;
    sourceId?: string;
    categoryId?: string;
    subcategoryId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
    }
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<{
      transactions: Transaction[];
      pagination: { total: number; page: number; limit: number; pages: number };
    }>(`/transactions${query}`);
  },
  createTransaction: (data: Partial<Transaction>) =>
    request<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTransaction: (id: string, data: Partial<Transaction>) =>
    request<Transaction>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTransaction: (id: string) =>
    request<{ message: string; id: string }>(`/transactions/${id}`, {
      method: 'DELETE',
    }),

  // Stats / Analytics
  getStats: (params?: { baseTypeId?: string; startDate?: string; endDate?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.baseTypeId) searchParams.append('baseTypeId', params.baseTypeId);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<StatsResponse>(`/stats/summary${query}`);
  },
};
