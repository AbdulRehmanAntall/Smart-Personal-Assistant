const frontendHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
const API_BASE = `http://${frontendHost}:8000/api`;

export const tokenStore = {
  getAccess: () => localStorage.getItem('access_token') ?? '',
  getRefresh: () => localStorage.getItem('refresh_token') ?? '',
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  },
  clear: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};

let refreshingPromise: Promise<void> | null = null;

async function refreshAccessToken(): Promise<void> {
  if (!tokenStore.getRefresh()) {
    throw new Error('Session expired');
  }
  if (!refreshingPromise) {
    refreshingPromise = fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: tokenStore.getRefresh() }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Unable to refresh token');
        const data = await res.json() as { access_token: string; refresh_token: string };
        tokenStore.setTokens(data.access_token, data.refresh_token);
      })
      .finally(() => {
        refreshingPromise = null;
      });
  }
  return refreshingPromise;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}, auth = true, retry = true): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isFormData) {
    headers.set('Content-Type', 'application/json');
  }
  if (auth && tokenStore.getAccess()) {
    headers.set('Authorization', `Bearer ${tokenStore.getAccess()}`);
  }
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (response.status === 401 && auth && retry) {
    try {
      await refreshAccessToken();
      return apiFetch<T>(path, options, auth, false);
    } catch {
      tokenStore.clear();
      throw new Error('Session expired. Please login again.');
    }
  }
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}
