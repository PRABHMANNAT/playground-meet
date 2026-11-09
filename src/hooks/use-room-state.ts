'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { request } from '@/lib/client';
import type { Snapshot } from '@/lib/types';
import type { Action } from '@/lib/schemas';
export function useRoomState(id: string) {
  const [data, setData] = useState<Snapshot | null>(null),
    [error, setError] = useState('');
  const alive = useRef(true),
    etag = useRef(''),
    requestVersion = useRef(0);
  const refresh = useCallback(async () => {
    const version = ++requestVersion.current;
    try {
      const response = await fetch(`/api/meetings/${id}/state`, {
        headers: etag.current ? { 'If-None-Match': etag.current } : {},
        cache: 'no-store',
      });
      if (!alive.current || version !== requestVersion.current) return;
      if (response.status === 304) {
        if (alive.current) setError('');
        return;
      }
      const next = await response.json();
      if (!alive.current || version !== requestVersion.current) return;
      if (!response.ok) throw new Error(next.error || 'Connection unavailable');
      etag.current = response.headers.get('etag') || '';
      if (alive.current) {
        setData({ ...next, clockOffset: next.serverTime - Date.now() });
        setError('');
      }
    } catch (e) {
      if (alive.current && version === requestVersion.current) setError((e as Error).message);
    }
  }, [id]);
  useEffect(() => {
    alive.current = true;
    etag.current = '';
    setData(null);
    setError('');
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout>;
    const poll = async () => {
      await refresh();
      if (!cancelled) timeout = setTimeout(poll, document.hidden ? 5000 : 1200);
    };
    void poll();
    return () => {
      alive.current = false;
      cancelled = true;
      requestVersion.current++;
      clearTimeout(timeout);
    };
  }, [refresh]);
  const act = useCallback(
    async (action: Action) => {
      const result = await request<{ ok: boolean; warning?: string }>(
        `/api/meetings/${id}/actions`,
        action,
      );
      await refresh();
      return result;
    },
    [id, refresh],
  );
  return { data, error, act, refresh };
}
