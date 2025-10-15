// Shared TypeScript types for the Nexus Email Service monorepo

export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: Date;
  lastLoginDate: Date;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}
