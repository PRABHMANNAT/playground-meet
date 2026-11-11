'use client';

import { useRef, useState, type PointerEvent } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { BrowserStroke } from '@/lib/types';
import type { PanelProps } from './types';

type Point = BrowserStroke['points'][number];

function Ink({ points }: { points: Point[] }) {
  if (points.length === 1) {
    const [[x, y]] = points;
    return <circle cx={x * 1000} cy={y * 1000} r={3} />;
  }
  return <polyline points={points.map(([x, y]) => `${x * 1000},${y * 1000}`).join(' ')} />;
}

export function BrowserAnnotations({
  shareId,
  strokes,
  canClear,
  send,
  children,
}: {
  shareId: string;
  strokes: BrowserStroke[];
  canClear: boolean;
  send: PanelProps['send'];
  children: React.ReactNode;
}) {
  const [drawing, setDrawing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Point[]>([]);
  const active = useRef<{ pointer: number; points: Point[] } | null>(null);

  function point(event: PointerEvent<SVGSVGElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    const normalize = (n: number) => Math.round(Math.max(0, Math.min(1, n)) * 10000) / 10000;
    return [
      normalize((event.clientX - rect.left) / rect.width),
      normalize((event.clientY - rect.top) / rect.height),
    ];
  }

  function move(event: PointerEvent<SVGSVGElement>) {
    const stroke = active.current;
    if (!stroke || stroke.pointer !== event.pointerId) return;
    const next = point(event);
    const last = stroke.points.at(-1)!;
    if (Math.hypot(next[0] - last[0], next[1] - last[1]) < 0.003) return;
    if (stroke.points.length < 160) stroke.points.push(next);
    else stroke.points[159] = next;
    setDraft([...stroke.points]);
  }

  async function finish(event: PointerEvent<SVGSVGElement>) {
    if (active.current?.pointer !== event.pointerId) return;
    move(event);
    const { points } = active.current;
    active.current = null;
    setBusy(true);
    try {
      await send({ type: 'browser-annotate', shareId, id: crypto.randomUUID(), points });
    } finally {
      setDraft([]);
      setBusy(false);
    }
  }

  return (
    <>
      <div className="browser-row">
        <button
          className={`button small ${drawing ? 'primary' : 'secondary'}`}
          aria-pressed={drawing}
          onClick={() => setDrawing(!drawing)}
        >
          <Pencil size={14} /> Annotate
        </button>
        {canClear && strokes.length > 0 && (
          <button
            className="button secondary small"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await send({ type: 'browser-clear-annotations', shareId });
              } finally {
                setBusy(false);
              }
            }}
          >
            <Trash2 size={14} /> Clear marks
          </button>
        )}
      </div>
      {drawing && (
        <p className="panel-helper">
          Draw on the preview to share a mark. Turn off Annotate to interact with the page.
        </p>
      )}
      <div className="browser-preview-stage">
        {children}
        <svg
          className="browser-ink"
          data-drawing={drawing}
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          aria-hidden="true"
          onPointerDown={(event) => {
            if (!drawing || busy || active.current || event.button !== 0) return;
            const points = [point(event)];
            active.current = { pointer: event.pointerId, points };
            event.currentTarget.setPointerCapture(event.pointerId);
            setDraft(points);
          }}
          onPointerMove={move}
          onPointerUp={(event) => void finish(event)}
          onLostPointerCapture={(event) => {
            if (active.current?.pointer !== event.pointerId) return;
            active.current = null;
            setDraft([]);
          }}
        >
          {strokes.map(({ id, points }) => (
            <Ink key={id} points={points} />
          ))}
          {draft.length > 0 && <Ink points={draft} />}
        </svg>
      </div>
    </>
  );
}
