'use client';
import { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { PanelProps } from './types';
const colors = ['#FF7548', '#123B3F', '#0864B6', '#8b5cf6'] as const;
export function BoardPanel({ data, send, host }: PanelProps) {
  const [color, setColor] = useState<(typeof colors)[number]>(colors[0]),
    [draft, setDraft] = useState<[number, number][]>([]);
  const drawing = useRef(false),
    points = useRef<[number, number][]>([]);
  const point = (e: React.PointerEvent<SVGSVGElement>): [number, number] => {
    const r = e.currentTarget.getBoundingClientRect();
    return [
      Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
      Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
    ];
  };
  const path = (p: number[][]) => p.map((v) => `${v[0] * 1000},${v[1] * 1000}`).join(' ');
  return (
    <div className="stack">
      <div className="whiteboard-controls">
        {colors.map((c) => (
          <button
            key={c}
            style={{ background: c }}
            className="swatch"
            aria-label={`Draw in ${c}`}
            aria-pressed={color === c}
            onClick={() => setColor(c)}
          />
        ))}
        {host && (
          <button
            className="icon-button"
            aria-label="Clear whiteboard"
            onClick={() => send({ type: 'clear-board' })}
          >
            <Trash2 size={17} />
          </button>
        )}
      </div>
      <svg
        className="whiteboard"
        viewBox="0 0 1000 1000"
        role="img"
        aria-label="Collaborative drawing canvas"
        onPointerDown={(e) => {
          drawing.current = true;
          points.current = [point(e)];
          setDraft(points.current);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drawing.current || points.current.length >= 500) return;
          points.current = [...points.current, point(e)];
          setDraft(points.current);
        }}
        onPointerUp={async () => {
          if (!drawing.current) return;
          drawing.current = false;
          const saved = points.current;
          setDraft([]);
          if (saved.length > 1)
            await send({ type: 'stroke', id: crypto.randomUUID(), color, points: saved });
        }}
        onPointerCancel={() => {
          drawing.current = false;
          setDraft([]);
        }}
      >
        {data.meeting.state.strokes.map((s) => (
          <polyline
            key={s.id}
            points={path(s.points)}
            fill="none"
            stroke={s.color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        <polyline
          points={path(draft)}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="panel-helper">
        Draw with your mouse, pen, or finger. Strokes are shared when you lift. Use shared notes for
        text and keyboard collaboration.
      </p>
      <small>{data.meeting.state.strokes.length} / 500 strokes</small>
    </div>
  );
}
