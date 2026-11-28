'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Globe,
  PenLine,
  ChartNoAxesColumn,
  NotepadText,
  Timer,
  Bookmark,
  Ellipsis,
  ListChecks,
  BookOpenCheck,
  Layers,
  Keyboard,
  Download,
  ChevronRight,
  ChevronLeft,
  Check,
} from 'lucide-react';
import type { Panel } from './panels/types';

const primary = [
  { key: 'browser', label: 'Shared browser', icon: Globe },
  { key: 'board', label: 'Whiteboard', icon: PenLine },
  { key: 'polls', label: 'Polls', icon: ChartNoAxesColumn },
  { key: 'notes', label: 'Notes', icon: NotepadText },
  { key: 'timer', label: 'Countdown', icon: Timer },
  { key: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
] as const;
const secondary = [
  { key: 'actions', label: 'Action items', icon: ListChecks },
  { key: 'decisions', label: 'Decision log', icon: BookOpenCheck },
  { key: 'review', label: 'Product review', icon: Layers },
  { key: 'shortcuts', label: 'Keyboard shortcuts', icon: Keyboard },
  { key: 'download', label: 'Download summary', icon: Download },
] as const;
type Tool = (typeof primary)[number]['key'] | (typeof secondary)[number]['key'];

export function MeetingTools({
  active,
  onSelect,
}: {
  active: Panel | 'board' | null;
  onSelect: (tool: Tool, keyboard: boolean) => void;
}) {
  const [open, setOpen] = useState<'hover' | 'pinned' | null>(null);
  const [more, setMore] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  function close() {
    setOpen(null);
    setMore(false);
  }
  function focusItem(index: number) {
    requestAnimationFrame(() => {
      const items = menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]');
      if (items?.length) items[(index + items.length) % items.length].focus();
    });
  }
  useEffect(() => {
    if (!open) return;
    function outside(event: Event) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) close();
    }
    function escape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      if (menu.current?.contains(document.activeElement)) trigger.current?.focus();
      close();
    }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    window.addEventListener('keydown', escape, true);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
      window.removeEventListener('keydown', escape, true);
    };
  }, [open]);
  const selected = [...primary, ...secondary].some(({ key }) => key === active);
  return (
    <div
      ref={root}
      className={'toolbar-tool more-tools' + (open || selected ? ' active' : '')}
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') setOpen((current) => current ?? 'hover');
      }}
      onPointerLeave={() => {
        if (open === 'hover' && !menu.current?.contains(document.activeElement)) close();
      }}
    >
      <button
        type="button"
        ref={trigger}
        className="control"
        aria-label="More tools"
        aria-haspopup="menu"
        aria-expanded={!!open}
        aria-controls={open ? 'meeting-tools-menu' : undefined}
        onClick={(e) => {
          if (open === 'pinned') close();
          else {
            setOpen('pinned');
            if (e.detail === 0) focusItem(0);
          }
        }}
        onKeyDown={(e) => {
          if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
          e.preventDefault();
          setOpen('pinned');
          focusItem(e.key === 'ArrowDown' ? 0 : -1);
        }}
      >
        <Ellipsis />
      </button>
      <span>More tools</span>
      {open && (
        <div className="tool-flyout">
          <div
            id="meeting-tools-menu"
            ref={menu}
            role="menu"
            aria-label="Meeting tools"
            className="tool-menu"
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                trigger.current?.focus();
                close();
                return;
              }
              e.stopPropagation();
              const items = Array.from(
                e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'),
              );
              const index = items.indexOf(document.activeElement as HTMLButtonElement);
              const next = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: -1 }[e.key];
              if (next !== undefined) {
                e.preventDefault();
                focusItem(next);
              }
            }}
          >
            {(more ? secondary : primary).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                role="menuitem"
                tabIndex={-1}
                className={key === 'timer' || key === 'shortcuts' ? 'tool-menu-break' : ''}
                onClick={(e) => {
                  trigger.current?.focus();
                  close();
                  onSelect(key, e.detail === 0);
                }}
              >
                <Icon aria-hidden="true" size={16} />
                <span>{label}</span>
                {active === key && <Check size={13} aria-label="Open" />}
              </button>
            ))}
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              className="tool-menu-nav"
              onClick={() => {
                setOpen('pinned');
                setMore(!more);
                focusItem(0);
              }}
            >
              {more ? (
                <>
                  <ChevronLeft size={14} /> Back
                </>
              ) : (
                <>
                  More options <ChevronRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
