import { getCookie } from 'cookies-next';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function getAuthHeaders(): HeadersInit {
  const token = getCookie('auth_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}
