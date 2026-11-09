'use client';
import { useEffect, useRef, useState } from 'react';
import { request } from '@/lib/client';
export default function PlaygroundSignIn() {
  const started = useRef(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const params = new URLSearchParams(location.hash.slice(1));
    const token = params.get('token');
    history.replaceState(null, '', location.pathname);
    if (!token) {
      setError('Your Playground sign-in link is missing its token.');
      return;
    }
    request('/api/auth/sso', { token })
      .then(() => location.replace('/'))
      .catch((e) => setError(e.message));
  }, []);
  return (
    <main id="main" className="document">
      <h1>{error ? 'Let’s try that again.' : 'Welcome from Playground.'}</h1>
      <p role="status">{error || 'Signing you in securely…'}</p>
      <a href="/">Continue to Meet</a>
    </main>
  );
}
