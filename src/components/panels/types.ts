import type { Snapshot } from '@/lib/types';
import type { Action } from '@/lib/schemas';
export type PanelProps = {
  data: Snapshot;
  send: (action: Action) => Promise<boolean>;
  host: boolean;
  demoNames?: string[];
  onRemoveDemo?: (name: string) => void;
};
export type Panel =
  'chat' | 'people' | 'notes' | 'polls' | 'board' | 'timer' | 'review' | 'browser';
