'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Clock, Download } from 'lucide-react';
import { request, downloadSummary } from '@/lib/client';
import { useToast } from './providers';
type Recent = { id: string; title: string; created: number; ended: boolean };
export function History({ personId }: { personId?: string }) {
  const [items, setItems] = useState<Recent[]>([]);
  const toast = useToast();
  useEffect(() => {
    if (!personId) {
      setItems([]);
      return;
    }
    let active = true;
    request<{ meetings: Recent[] }>('/api/meetings')
      .then((r) => {
        if (active) setItems(r.meetings);
      })
      .catch((e) => toast(e.message));
    return () => {
      active = false;
    };
  }, [personId, toast]);
  if (!items.length) return null;
  return (
    <section className="history-section">
      <div className="section-heading">
        <h2>Pick up where you left off.</h2>
        <span className="eyebrow">YOUR RECENT SPACES</span>
      </div>
      <div className="history-grid">
        {items.slice(0, 6).map((item) => (
          <article className="history-card" key={item.id}>
            <Clock size={18} />
            <div>
              <h3>{item.title}</h3>
              <small>
                {new Date(Number(item.created)).toLocaleDateString()} ·{' '}
                {item.ended ? 'Ended' : 'Open'}
              </small>
            </div>
            {item.ended ? (
              <button
                className="icon-button"
                aria-label={`Download ${item.title} summary`}
                onClick={() => downloadSummary(item.id).catch((e) => toast(e.message))}
              >
                <Download size={18} />
              </button>
            ) : (
              <Link aria-label={`Rejoin ${item.title}`} href={'/room/' + item.id}>
                <ArrowUpRight size={20} />
              </Link>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
