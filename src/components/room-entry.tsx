'use client';
import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { Prejoin } from './prejoin';
import type { Devices } from './device-preview';
const Meeting = dynamic(() => import('./meeting'), {
  ssr: false,
  loading: () => <div className="room-connect">Opening your meeting…</div>,
});
export function RoomEntry({ id }: { id: string }) {
  const [devices, setDevices] = useState<Devices | null>(null);
  const join = useCallback((d: Devices) => setDevices(d), []);
  return devices ? (
    <Meeting id={id} devices={devices} onBack={() => setDevices(null)} />
  ) : (
    <Prejoin id={id} onJoin={join} />
  );
}
