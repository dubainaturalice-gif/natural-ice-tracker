// ---- User / Auth ----
export type UserRole = 'admin' | 'manager' | 'worker';

export interface User {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  team: number | null;
  shift: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ---- Navigation ----
export type Page =
  | 'dashboard'
  | 'shift-entry'
  | 'monthly-summary'
  | 'user-management';

// ---- Production ----
export interface ProductionEntry {
  date: string;
  shift: string;
  team: number;
  product: string;
  hour: string;
  quantity: number;
}

// ---- Materials ----
export interface MaterialEntry {
  date: string;
  shift: string;
  team: number;
  material: string;
  quantity: number;
}

// ---- Shift selection ----
export interface ShiftSelection {
  date: string;
  shift: string;
}
