'use client';
import { useState } from 'react';
import { Dialog } from './dialog';
import { request } from '@/lib/client';
import { useToast } from './providers';
import type { Person } from '@/lib/types';
export function Account({
  person,
  onChange,
}: {
  person: Person | null;
  onChange: (p: Person | null) => void;
}) {
  const [open, setOpen] = useState(false),
    [register, setRegister] = useState(false),
    [busy, setBusy] = useState(false);
  const toast = useToast();
  return (
    <>
      <button className="button small secondary" onClick={() => setOpen(true)}>
        {person?.account ? person.name : 'Sign in'}
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={person?.account ? 'Your account' : register ? 'Create an account' : 'Sign in'}
      >
        {person?.account ? (
          <>
            <p>You’re signed in as {person.name}.</p>
            <button
              className="button secondary"
              onClick={async () => {
                try {
                  await request('/api/session', undefined, 'DELETE');
                  onChange(null);
                  setOpen(false);
                } catch (e) {
                  toast((e as Error).message);
                }
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <form
            className="stack"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              const f = new FormData(e.currentTarget);
              try {
                const r = await request<{ person: Person }>('/api/auth', {
                  mode: register ? 'register' : 'login',
                  email: f.get('email'),
                  password: f.get('password'),
                  ...(register ? { name: f.get('name') } : {}),
                });
                onChange(r.person);
                setOpen(false);
              } catch (e) {
                toast((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <p className="muted">
              Save your meeting history across devices. You can also start instantly as a guest.
            </p>
            {register && (
              <label>
                Your name
                <input name="name" required maxLength={60} autoComplete="name" />
              </label>
            )}
            <label>
              Email
              <input name="email" type="email" required autoComplete="email" />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                required
                minLength={12}
                maxLength={128}
                autoComplete={register ? 'new-password' : 'current-password'}
              />
              <small>At least 12 characters.</small>
            </label>
            <button className="button primary" disabled={busy}>
              {busy ? 'One moment…' : register ? 'Create account' : 'Sign in'}
            </button>
            <button type="button" className="text-button" onClick={() => setRegister(!register)}>
              {register ? 'Already have an account? Sign in' : 'New here? Create an account'}
            </button>
          </form>
        )}
      </Dialog>
    </>
  );
}
