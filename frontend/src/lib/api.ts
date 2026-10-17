import { getCookie } from 'cookies-next';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://ky-duyet-backend.vercel.app'
    : 'http://localhost:5000');

export function getAuthHeaders(): HeadersInit {
  const token = getCookie('auth_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}
