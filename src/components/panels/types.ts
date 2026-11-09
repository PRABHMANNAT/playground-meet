import type {Snapshot} from '@/lib/types';import type {Action} from '@/lib/schemas';
export type PanelProps={data:Snapshot;send:(action:Action)=>Promise<boolean>;host:boolean};
export type Panel='chat'|'people'|'notes'|'polls'|'board'|'timer'|'review';
