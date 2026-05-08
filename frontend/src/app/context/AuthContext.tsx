import { createContext, useEffect, useState } from 'react';
import { apiFetch, tokenStore } from '../../lib/api';

interface User {
  email: string;
  name: string;
}

interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType
);

const USER_CACHE_KEY = 'auth_user_cache';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(tokenStore.getAccess())
  );

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // If we have a token, try to show something immediately while we validate.
    // This prevents brief "flash then redirect" when the backend is temporarily unreachable.
    const cachedRaw = localStorage.getItem(USER_CACHE_KEY);
    if (cachedRaw) {
      try {
        setUser(JSON.parse(cachedRaw) as User);
      } catch {
        // ignore bad cache
      }
    }

    const validateSession = async () => {
      const token = tokenStore.getAccess();

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 15000);
        const me = await apiFetch<User>('/auth/me', { signal: controller.signal });
        window.clearTimeout(timeoutId);
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(me));
        setUser(me);
        setIsAuthenticated(true);
      } catch (err) {
        // If backend is down / network is flaky, don't force-logout.
        // Only clear tokens on real session expiration.
        const message = err instanceof Error ? err.message : '';
        const isAbort =
          err instanceof DOMException ? err.name === 'AbortError' : false;
        const isNetwork =
          err instanceof TypeError || message.toLowerCase().includes('failed to fetch');
        const isExpired =
          message.toLowerCase().includes('session expired') ||
          message.toLowerCase().includes('unable to refresh token');

        if (isExpired) {
          tokenStore.clear();
          localStorage.removeItem(USER_CACHE_KEY);
          setUser(null);
          setIsAuthenticated(false);
        } else if (isAbort || isNetwork) {
          // Keep the token-based auth state; user may come from cache.
          setIsAuthenticated(true);
        } else {
          // Unknown error: safest is to treat as unauthenticated.
          tokenStore.clear();
          localStorage.removeItem(USER_CACHE_KEY);
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    validateSession();
  }, []);

  const login = async (email: string, password: string) => {
    const tokens = await apiFetch<{
      access_token: string;
      refresh_token: string;
    }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
      false
    );

    tokenStore.setTokens(tokens.access_token, tokens.refresh_token);

    const me = await apiFetch<User>('/auth/me');
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(me));
    setUser(me);
    setIsAuthenticated(true);
  };

  const signup = async (name: string, email: string, password: string) => {
    const tokens = await apiFetch<{
      access_token: string;
      refresh_token: string;
    }>(
      '/auth/signup',
      {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      },
      false
    );

    tokenStore.setTokens(tokens.access_token, tokens.refresh_token);

    const me = await apiFetch<User>('/auth/me');
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(me));
    setUser(me);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    tokenStore.clear();
    localStorage.removeItem(USER_CACHE_KEY);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ isLoading, isAuthenticated, user, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}