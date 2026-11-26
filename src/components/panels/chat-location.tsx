'use client';

import { useState } from 'react';
import { LocateFixed, MapPin } from 'lucide-react';
import { Dialog } from '../dialog';

export type ChatLocation = { label: string; latitude?: number; longitude?: number };
export function mapLink(location: ChatLocation) {
  if (location.latitude === undefined || location.longitude === undefined)
    return 'https://www.openstreetmap.org/search?query=' + encodeURIComponent(location.label);
  const { latitude, longitude } = location;
  return (
    'https://www.openstreetmap.org/?mlat=' +
    latitude +
    '&mlon=' +
    longitude +
    '#map=16/' +
    latitude +
    '/' +
    longitude
  );
}

export function ChatLocationDialog({
  audience,
  close,
  send,
}: {
  audience: string;
  close: () => void;
  send: (location: ChatLocation) => Promise<boolean>;
}) {
  const [place, setPlace] = useState<ChatLocation>({ label: '' });
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  function locate() {
    if (!navigator.geolocation) {
      setError('Enter a place name or address on this device.');
      return;
    }
    setWorking(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPlace({
          label: 'Shared location',
          latitude: Number(coords.latitude.toFixed(5)),
          longitude: Number(coords.longitude.toFixed(5)),
        });
        setWorking(false);
      },
      () => {
        setError('Location unavailable. Enter a place name or address instead.');
        setWorking(false);
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  }
  return (
    <Dialog open onClose={close} title={'Send a location to ' + audience}>
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          if (working || !place.label.trim()) return;
          setWorking(true);
          try {
            if (await send(place)) close();
          } finally {
            setWorking(false);
          }
        }}
      >
        <label>
          Place or address
          <input
            value={place.label}
            maxLength={160}
            disabled={working}
            placeholder="Sydney Opera House"
            onChange={(e) => {
              setPlace({ label: e.target.value });
              setError('');
            }}
          />
        </label>
        <button type="button" className="button secondary" onClick={locate} disabled={working}>
          <LocateFixed size={16} /> Use my current location
        </button>
        {place.latitude !== undefined && (
          <p className="panel-helper">
            Pin at {place.latitude}, {place.longitude}
          </p>
        )}
        {error && <p role="alert">{error}</p>}
        <button className="button primary" disabled={!place.label.trim() || working}>
          <MapPin size={16} /> Send location
        </button>
      </form>
    </Dialog>
  );
}
