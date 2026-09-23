/**
 * Helper to construct WebSocket URLs based on API configuration
 */
export const getWebSocketUrl = (path, params = {}) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  let host = 'localhost:8000';
  let protocol = 'ws:';

  try {
    const url = new URL(apiUrl);
    protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    host = url.host;
  } catch {
    // fallback if URL parsing fails
    protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    host = window.location.host;
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const searchParams = new URLSearchParams(params);
  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';

  return `${protocol}//${host}${cleanPath}${queryString}`;
};
