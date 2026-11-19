'use client';
import { X } from 'lucide-react';
import { ChatPanel } from './chat';
import { PeoplePanel } from './people';
import { NotesPanel } from './notes';
import { PollsPanel } from './polls';
import { ActionItemsPanel, DecisionLogPanel } from './outcomes';
import { ReviewPanel } from './review';
import { BrowserPanel } from './browser';
import type { Panel, PanelProps } from './types';
const panels = {
  chat: ChatPanel,
  people: PeoplePanel,
  notes: NotesPanel,
  polls: PollsPanel,
  actions: ActionItemsPanel,
  decisions: DecisionLogPanel,
  review: ReviewPanel,
  browser: BrowserPanel,
};
const titles = {
  chat: 'Chat',
  people: 'People',
  notes: 'Shared notes',
  polls: 'Polls',
  actions: 'Action items',
  decisions: 'Decision log',
  review: 'Product review',
  browser: 'Shared browser',
};
export function SidePanel({
  panel,
  onClose,
  hidden,
  ...props
}: PanelProps & { panel: Panel; hidden?: boolean; onClose: () => void }) {
  const Content = panels[panel];
  return (
    <aside className="room-panel" aria-label={titles[panel]} data-panel={panel} hidden={hidden}>
      <div className="panel-heading">
        <h2>{titles[panel]}</h2>
        <button className="icon-button" onClick={onClose} aria-label="Close panel">
          <X size={18} />
        </button>
      </div>
      <div className="panel-content">
        <Content {...props} />
      </div>
    </aside>
  );
}
