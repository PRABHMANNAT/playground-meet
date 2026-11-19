'use client';
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import {
  Pencil,
  Minus,
  Square,
  Undo2,
  Trash2,
  Maximize2,
  Minimize2,
  Presentation,
  Download,
  X,
  PanelsTopLeft,
} from 'lucide-react';
import {
  drawingPoints,
  paperPoints,
  isDot,
  boardWidth,
  boardHeight,
  type BoardTool,
  type Point,
} from '@/lib/board-geometry';
import { request } from '@/lib/client';
import type { Stroke } from '@/lib/types';
import type { PanelProps } from './types';
import { useToast } from '../providers';

type Draft = {
  id: string;
  pointer: number;
  epoch: number;
  tool: BoardTool;
  width: number;
  points: Point[];
};
function Ink({ stroke }: { stroke: Stroke }) {
  const points = paperPoints(stroke),
    w = stroke.width ?? 4.5;
  const title = <title>{stroke.name || 'Participant'}</title>;
  return isDot(points) ? (
    <circle cx={points[0][0]} cy={points[0][1]} r={w / 2} fill={stroke.color}>
      {title}
    </circle>
  ) : (
    <polyline
      points={points.map((p) => p.join(',')).join(' ')}
      fill="none"
      stroke={stroke.color}
      strokeWidth={w}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {title}
    </polyline>
  );
}
const pens = [
  { id: 'pen', name: 'Pen', icon: Pencil },
  { id: 'line', name: 'Line', icon: Minus },
  { id: 'rectangle', name: 'Rectangle', icon: Square },
] as const;
export function BoardPanel({
  data,
  send,
  host,
  expanded,
  onExpand,
  onClose,
}: PanelProps & { expanded: boolean; onExpand: (expand: boolean) => void; onClose: () => void }) {
  const { meeting, me } = data,
    state = meeting.state,
    presenter = state.boardPresenter,
    epoch = state.boardEpoch ?? 0;
  const dialog = useRef<HTMLDialogElement>(null),
    active = useRef<Draft | null>(null);
  const [tool, setTool] = useState<BoardTool>('pen'),
    [width, setWidth] = useState(4),
    [draft, setDraft] = useState<Stroke | null>(null),
    [saving, setSaving] = useState(false),
    [busy, setBusy] = useState(false),
    [confirmClear, setConfirmClear] = useState(false);
  const toast = useToast();
  useLayoutEffect(() => {
    const el = dialog.current!;
    el.close();
    if (expanded) el.showModal();
    else el.show();
    return () => el.close();
  }, [expanded]);
  useEffect(() => {
    if (!expanded) return;
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        onExpand(false);
      }
    }
    window.addEventListener('keydown', escape, true);
    return () => window.removeEventListener('keydown', escape, true);
  }, [expanded, onExpand]);
  useEffect(() => {
    active.current = null;
    setDraft(null);
  }, [epoch]);
  const endpoint = '/api/meetings/' + meeting.id + '/actions';
  const transmitting = useRef(false);
  function preview(d: Draft) {
    if (transmitting.current) return;
    const pts = drawingPoints(d.tool, d.points);
    const sample =
      pts.length <= 50
        ? pts
        : Array.from({ length: 50 }, (_, i) => pts[Math.round((i * (pts.length - 1)) / 49)]);
    transmitting.current = true;
    void request(endpoint, {
      type: 'board-preview',
      epoch: d.epoch,
      id: d.id,
      width: d.width,
      points: sample,
    })
      .catch(() => {})
      .finally(() => {
        transmitting.current = false;
      });
  }
  useEffect(() => {
    const tick = window.setInterval(() => {
      if (active.current) preview(active.current);
    }, 850);
    return () => window.clearInterval(tick);
  }, [endpoint]);
  function position(e: PointerEvent<SVGSVGElement>): Point {
    const rect = e.currentTarget.getBoundingClientRect();
    const unit = (n: number) => Math.round(Math.max(0, Math.min(1, n)) * 10000) / 10000;
    return [unit((e.clientX - rect.left) / rect.width), unit((e.clientY - rect.top) / rect.height)];
  }
  function renderDraft(d: Draft): Stroke {
    return {
      id: d.id,
      author: me.id,
      name: me.name,
      color: '#171717',
      width: d.width,
      wide: true,
      points: drawingPoints(d.tool, [...d.points]),
    };
  }
  function move(e: PointerEvent<SVGSVGElement>) {
    const d = active.current;
    if (!d || d.pointer !== e.pointerId) return;
    const next = position(e),
      last = d.points.at(-1)!;
    if (next[0] === last[0] && next[1] === last[1]) return;
    if (d.tool !== 'pen' && d.points.length > 1) d.points[1] = next;
    else {
      if (d.points.length >= 500) d.points = d.points.filter((_, i) => i % 2 === 0);
      d.points.push(next);
    }
    setDraft(renderDraft(d));
  }
  async function finish(e: PointerEvent<SVGSVGElement>) {
    const d = active.current;
    if (!d || d.pointer !== e.pointerId) return;
    move(e);
    active.current = null;
    const mark = renderDraft(d);
    setSaving(true);
    try {
      await send({
        type: 'stroke',
        id: d.id,
        color: '#171717',
        wide: true,
        width: d.width,
        epoch: d.epoch,
        points: mark.points as Point[],
      });
    } finally {
      setSaving(false);
      setDraft(null);
    }
  }
  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Whiteboard operation failed.');
    } finally {
      setBusy(false);
    }
  }
  const remote = Object.entries(state.boardPreviews ?? {}).filter(
    ([id, s]) => id !== me.id && s.expires > Date.now() + (data.clockOffset ?? 0),
  );
  const mine = state.strokes.findLast((s) => s.author === me.id);
  const last = state.strokes.at(-1);
  const author = last?.name ?? data.members.find((m) => m.id === last?.author)?.name;
  const locked = busy || saving || !!draft;
  return (
    <dialog
      ref={dialog}
      className={'board-studio' + (expanded ? ' board-full' : '')}
      aria-label="Whiteboard workspace"
      onCancel={(e) => {
        e.preventDefault();
        onExpand(false);
      }}
    >
      <div className="board-top">
        <header className="board-head">
          <div className="board-title">
            <PanelsTopLeft size={19} />
            <h2>Whiteboard</h2>
          </div>
          <div className="board-head-actions">
            {(!presenter || presenter.id === me.id || host) && (
              <button
                className="board-share"
                disabled={locked}
                onClick={() =>
                  void act(async () => {
                    if (await send({ type: 'board-share', active: !presenter })) onExpand(false);
                  })
                }
              >
                <Presentation size={15} />
                {presenter ? 'Stop sharing' : 'Share to all'}
              </button>
            )}
            <button
              title="Export PDF"
              aria-label="Export PDF"
              disabled={locked || remote.length > 0}
              onClick={() =>
                void act(async () => {
                  const { downloadBoardPdf } = await import('@/lib/board-pdf');
                  await downloadBoardPdf(state.strokes, meeting.id, meeting.title);
                })
              }
            >
              <Download size={16} />
              <span>PDF</span>
            </button>
            <button
              title={expanded ? 'Exit fullscreen' : 'Fullscreen'}
              aria-label={expanded ? 'Exit fullscreen' : 'Fullscreen'}
              onClick={() => onExpand(!expanded)}
            >
              {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            {!presenter && (
              <button title="Close whiteboard" aria-label="Close whiteboard" onClick={onClose}>
                <X size={16} />
              </button>
            )}
          </div>
        </header>
        <div className="board-tools" role="toolbar" aria-label="Drawing tools">
          {pens.map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              aria-label={name}
              title={name}
              aria-pressed={tool === id}
              onClick={() => setTool(id)}
            >
              <Icon size={16} />
            </button>
          ))}
          <select
            aria-label="Stroke weight"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
          >
            <option value={2}>Fine</option>
            <option value={4}>Medium</option>
            <option value={9}>Bold</option>
          </select>
          <button
            aria-label="Undo my last mark"
            title="Undo my last mark"
            disabled={!mine || locked}
            onClick={() => mine && void act(() => send({ type: 'board-undo', id: mine.id }))}
          >
            <Undo2 size={16} />
          </button>
          {host && (
            <button
              title="Clear whiteboard"
              aria-label="Clear whiteboard"
              disabled={!state.strokes.length || locked}
              onClick={() => setConfirmClear(true)}
            >
              <Trash2 size={15} />
            </button>
          )}
          {confirmClear && (
            <div className="board-confirm">
              <span>Clear all marks?</span>
              <button onClick={() => setConfirmClear(false)}>Cancel</button>
              <button
                onClick={() => {
                  setConfirmClear(false);
                  void act(() => send({ type: 'clear-board' }));
                }}
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="board-desk">
        <svg
          className="board-sheet"
          viewBox={`0 0 ${boardWidth} ${boardHeight}`}
          aria-label="Collaborative drawing canvas"
          role="img"
          onPointerDown={(e) => {
            if (active.current || busy || saving || e.button !== 0) return;
            const d = {
              id: crypto.randomUUID(),
              pointer: e.pointerId,
              epoch,
              tool,
              width,
              points: [position(e)],
            };
            active.current = d;
            e.currentTarget.setPointerCapture(e.pointerId);
            setDraft(renderDraft(d));
            preview(d);
          }}
          onPointerMove={move}
          onPointerUp={(e) => void finish(e)}
          onLostPointerCapture={(e) => {
            if (active.current?.pointer === e.pointerId) {
              active.current = null;
              setDraft(null);
            }
          }}
        >
          {state.strokes.map((s) => (
            <Ink key={s.id} stroke={s} />
          ))}
          {remote.map(([id, s]) => {
            const end = s.points.at(-1)!;
            return (
              <g key={id}>
                <Ink stroke={{ ...s, wide: true, color: '#171717', author: id }} />
                <svg
                  x={Math.min(1390, end[0] * boardWidth + 8)}
                  y={Math.min(850, end[1] * boardHeight + 8)}
                  width="205"
                  height="40"
                >
                  <rect width="205" height="38" rx="8" fill="#171717" />
                  <text x="10" y="26" fill="white" fontSize="23">
                    {s.name}
                  </text>
                </svg>
              </g>
            );
          })}
          {draft && <Ink stroke={draft} />}
        </svg>
      </div>
      <footer className="board-caption">
        <span>{presenter ? 'Presented by ' + presenter.name : 'Meeting canvas'}</span>
        <span role="status">
          {draft
            ? me.name + ' is drawing'
            : remote.length
              ? remote.map(([, s]) => s.name).join(', ') + ' · drawing'
              : author
                ? 'Last mark by ' + author
                : 'No marks yet'}
        </span>
      </footer>
    </dialog>
  );
}
