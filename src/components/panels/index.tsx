'use client';
import { X } from 'lucide-react';
import type { TranscriptControls } from '@/hooks/use-transcript';
import type { CaptionTranslation } from '@/hooks/use-caption-translation';
import { TranscriptPanel } from './transcript';
import { ChatPanel } from './chat';
import { PeoplePanel } from './people';
import { NotesPanel } from './notes';
import { PollsPanel } from './polls';
import { ActionItemsPanel, DecisionLogPanel } from './outcomes';
import { ReviewPanel } from './review';
import { BrowserPanel, type BrowserControls } from './browser';
import type { Panel, PanelProps } from './types';
const panels = {
  chat: ChatPanel,
  people: PeoplePanel,
  notes: NotesPanel,
  polls: PollsPanel,
  actions: ActionItemsPanel,
  decisions: DecisionLogPanel,
  review: ReviewPanel,
};
const titles = {
  transcript: 'Live transcript',
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
  speech,
  translation,
  browser,
  ...props
}: PanelProps & {
  panel: Panel;
  speech: TranscriptControls;
  translation: CaptionTranslation;
  browser: BrowserControls;
  hidden?: boolean;
  onClose: () => void;
}) {
  const Content = panel === 'transcript' || panel === 'browser' ? null : panels[panel];
  return (
    <aside className="room-panel" aria-label={titles[panel]} data-panel={panel} hidden={hidden}>
      <div className="panel-heading">
        <h2>{titles[panel]}</h2>
        <button className="icon-button" onClick={onClose} aria-label="Close panel">
          <X size={18} />
        </button>
      </div>
      <div className="panel-content">
        {panel === 'browser' ? (
          <BrowserPanel {...props} controls={browser} visible={!hidden} />
        ) : Content ? (
          <Content {...props} />
        ) : (
          <TranscriptPanel data={props.data} speech={speech} translation={translation} />
        )}
      </div>
    </aside>
  );
}
