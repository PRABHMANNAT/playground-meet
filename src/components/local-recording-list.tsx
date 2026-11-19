'use client';
import { useEffect, useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import {
  deleteRecording,
  downloadRecording,
  localRecordings,
  type LocalRecording,
} from '@/lib/local-recordings';
import { useToast } from './providers';

export function LocalRecordingList({ scope }: { scope: string }) {
  const [items, setItems] = useState<LocalRecording[]>([]);
  const toast = useToast();
  useEffect(() => {
    let mounted = true;
    const refresh = () => {
      void localRecordings(scope)
        .then((rows) => {
          if (mounted) setItems(rows);
        })
        .catch(() => {});
    };
    refresh();
    window.addEventListener('local-recordings-changed', refresh);
    return () => {
      mounted = false;
      window.removeEventListener('local-recordings-changed', refresh);
    };
  }, [scope]);
  if (!items.length) return null;
  return (
    <section className="recap-card">
      <h2>Local recordings</h2>
      {items.map((item) => (
        <div className="local-recording-row" key={item.id}>
          <div>
            <strong>{item.title}</strong>
            <small>{new Date(item.started).toLocaleString()}</small>
          </div>
          <button
            className="icon-button"
            aria-label="Download recording"
            onClick={() => downloadRecording(item).catch((e) => toast(e.message))}
          >
            <Download size={16} />
          </button>
          <button
            className="icon-button"
            aria-label="Delete local copy"
            onClick={async () => {
              if (!window.confirm('Delete this recording from browser storage on this device?'))
                return;
              try {
                await deleteRecording(item.id);
                setItems((rows) => rows.filter((row) => row.id !== item.id));
              } catch (error) {
                toast(
                  error instanceof Error ? error.message : 'Could not delete this local recording.',
                );
              }
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </section>
  );
}
