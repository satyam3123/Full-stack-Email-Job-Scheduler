import type { EmailDelivery, ScheduleRequest, SchedulerSettings, User } from './types';

// In production the Express service hosts this compiled app, so an empty value
// deliberately keeps requests same-origin. Local Vite development uses .env.
const API_URL = import.meta.env.VITE_API_URL ?? '';

class ApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Request failed. Please try again.', response.status);
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

export const api = {
  authUrl: `${API_URL}/auth/google`,
  me: () => request<{ user: User | null }>('/auth/me'),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  emails: (kind: 'scheduled' | 'sent') => request<{ emails: EmailDelivery[] }>(`/api/emails?status=${kind}`),
  settings: () => request<SchedulerSettings>('/api/emails/settings'),
  schedule: (payload: ScheduleRequest) => request<{ campaign: { id: string; scheduledCount: number } }>('/api/schedule', {
    method: 'POST', body: JSON.stringify(payload)
  })
};

export { ApiError };
