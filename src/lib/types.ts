export type Person = { id: string; name: string; account: boolean };
export type Member = {
  id: string;
  name: string;
  status: 'waiting' | 'admitted' | 'denied';
  hand: boolean;
  joined: number;
};
export type Event = {
  id: number;
  kind: string;
  actor: string;
  name: string;
  payload: Record<string, unknown>;
  created: number;
};
export type Meeting = {
  id: string;
  title: string;
  host: string;
  created: number;
  ended: boolean;
  locked: boolean;
  lobby: boolean;
  revision: number;
  state: SharedState;
};
export type Poll = {
  id: string;
  question: string;
  options: string[];
  votes: Record<string, number>;
  closed: boolean;
};
export type Stroke = { id: string; author: string; color: string; points: number[][] };
export type SharedState = {
  notes: string;
  notesVersion: number;
  polls: Poll[];
  strokes: Stroke[];
  timer: { endsAt: number; duration: number };
  review: { url: string; task: string };
};
export type Snapshot = {
  meeting: Meeting;
  members: Member[];
  events: Event[];
  me: Person;
  serverTime: number;
  clockOffset?: number;
};
export const emptyState = (): SharedState => ({
  notes: '',
  notesVersion: 0,
  polls: [],
  strokes: [],
  timer: { endsAt: 0, duration: 300 },
  review: { url: '', task: '' },
});
