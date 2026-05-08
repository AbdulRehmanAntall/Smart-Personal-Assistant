import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenStore } from '../lib/api';

function parseHash(hash: string) {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new URLSearchParams(raw);
  return {
    access: params.get('access_token') ?? '',
    refresh: params.get('refresh_token') ?? '',
  };
}

export default function GoogleOAuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const { access, refresh } = parseHash(window.location.hash);
    if (access && refresh) {
      tokenStore.setTokens(access, refresh);
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 px-6">
      <div className="text-slate-900 dark:text-slate-100 text-base">
        Finishing Google sign-in...
      </div>
    </div>
  );
}

