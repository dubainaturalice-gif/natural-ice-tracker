import { AuthResponse, User } from './types';

const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

function setToken(token: string): void {
  localStorage.setItem('token', token);
}

function clearToken(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearToken();
    window.location.reload();
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

// Auth
export async function login(username: string, password: string): Promise<AuthResponse> {
  const data = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setToken(data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data;
}

export function logout(): void {
  clearToken();
}

export function getStoredUser(): User | null {
  const u = localStorage.getItem('user');
  if (!u) return null;
  try {
    return JSON.parse(u);
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  return getToken();
}

// Users
export async function getUsers(): Promise<User[]> {
  return request<User[]>('/users');
}

export async function createUser(data: { username: string; name: string; password: string; role: string; team: number | null; shift: string | null }): Promise<User> {
  return request<User>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateUser(id: number, data: { username: string; name: string; password: string; role: string; team: number | null; shift: string | null }): Promise<User> {
  return request<User>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: number): Promise<void> {
  await request(`/users/${id}`, { method: 'DELETE' });
}

// Production
export async function getProduction(date: string, shift: string, team: number): Promise<Array<{ product: string; hour: string; quantity: number }>> {
  return request(`/production?date=${date}&shift=${shift}&team=${team}`);
}

export async function saveProduction(date: string, shift: string, team: number, entries: Array<{ product: string; hour: string; quantity: number }>): Promise<void> {
  await request('/production', {
    method: 'POST',
    body: JSON.stringify({ date, shift, team, entries }),
  });
}

export async function getProductionSummary(startDate: string, endDate: string): Promise<Array<{ date: string; shift: string; team: number; product: string; total: number }>> {
  return request(`/production/summary?startDate=${startDate}&endDate=${endDate}`);
}

export async function getProductionStats(date: string): Promise<{ morningTotal: number; nightTotal: number }> {
  return request(`/production/stats?date=${date}`);
}

// Materials
export async function getMaterials(date: string, shift: string, team: number): Promise<Array<{ material: string; initial_stock: number; using_qty: number }>> {
  return request(`/materials?date=${date}&shift=${shift}&team=${team}`);
}

export async function getPrevMaterials(date: string, shift: string, team: number): Promise<Array<{ material: string; initial_stock: number; using_qty: number }>> {
  return request(`/materials/prev?date=${date}&shift=${shift}&team=${team}`);
}

export async function saveMaterials(date: string, shift: string, team: number, entries: Array<{ material: string; initial_stock: number; using_qty: number }>): Promise<void> {
  await request('/materials', {
    method: 'POST',
    body: JSON.stringify({ date, shift, team, entries }),
  });
}
