'use client';
import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { Prejoin } from './prejoin';
import type { Devices } from './device-preview';
import type { MeetingAvatar } from '@/lib/meeting-avatars';
const Meeting = dynamic(() => import('./meeting'), {
  ssr: false,
  loading: () => <div className="room-connect">Opening your meeting…</div>,
});
export function RoomEntry({ id }: { id: string }) {
  const [devices, setDevices] = useState<Devices | null>(null);
  const [avatar, setAvatar] = useState<MeetingAvatar>();
  const join = useCallback((d: Devices) => setDevices(d), []);
  return devices ? (
    <Meeting id={id} devices={devices} avatar={avatar} onBack={() => setDevices(null)} />
  ) : (
    <Prejoin id={id} avatar={avatar} onAvatarChange={setAvatar} onJoin={join} />
  );
}
