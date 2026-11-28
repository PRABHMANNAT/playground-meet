'use client';
import { Volume2, VolumeX, X } from 'lucide-react';
import type { TranscriptControls } from '@/hooks/use-transcript';
import type { CaptionTranslation } from '@/hooks/use-caption-translation';
import { TranscriptPanel } from './transcript';
import { BookmarksPanel } from './bookmarks';
import { CountdownPanel } from './countdown';
import { ChatPanel } from './chat';
import { PeoplePanel } from './people';
import { NotesPanel } from './notes';
import { PollsPanel } from './polls';
import { ActionItemsPanel, DecisionLogPanel } from './outcomes';
import { ReviewPanel } from './review';
import { BrowserPanel, type BrowserControls } from './browser';
import type { Panel, PanelProps } from './types';
const panels = {
  bookmarks: BookmarksPanel,
  chat: ChatPanel,
  people: PeoplePanel,
  notes: NotesPanel,
  polls: PollsPanel,
  actions: ActionItemsPanel,
  decisions: DecisionLogPanel,
  review: ReviewPanel,
};
const titles = {
  timer: 'Countdown',
  bookmarks: 'Bookmarks',
  transcript: 'Live transcript',
  chat: 'Chat',
  people: 'People',
  notes: 'Notes',
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
  now,
  speech,
  translation,
  pollSounds,
  browser,
  ...props
}: PanelProps & {
  panel: Panel;
  pollSounds: { enabled: boolean; toggle: () => void };
  speech: TranscriptControls;
  translation: CaptionTranslation;
  browser: BrowserControls;
  hidden?: boolean;
  now: number;
  onClose: () => void;
}) {
  const Content =
    panel === 'transcript' || panel === 'browser' || panel === 'timer' ? null : panels[panel];
  return (
    <aside className="room-panel" aria-label={titles[panel]} data-panel={panel} hidden={hidden}>
      <div className="panel-heading">
        <h2>{titles[panel]}</h2>
        {panel === 'polls' && (
          <button
            className="icon-button poll-sound"
            aria-label="Poll sounds"
            aria-pressed={pollSounds.enabled}
            title={pollSounds.enabled ? 'Mute poll sounds' : 'Enable poll sounds'}
            onClick={pollSounds.toggle}
          >
            {pollSounds.enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        )}
        <button className="icon-button" onClick={onClose} aria-label="Close panel">
          <X size={18} />
        </button>
      </div>
      <div className="panel-content">
        {panel === 'browser' ? (
          <BrowserPanel {...props} controls={browser} visible={!hidden} />
        ) : panel === 'timer' ? (
          <CountdownPanel {...props} now={now} />
        ) : Content ? (
          <Content {...props} />
        ) : (
          <TranscriptPanel data={props.data} speech={speech} translation={translation} />
        )}
      </div>
    </aside>
  );
}
