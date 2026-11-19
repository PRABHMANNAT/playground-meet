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
export type Stroke = {
  id: string;
  author: string;
  name?: string;
  wide?: boolean;
  width?: number;
  color: string;
  points: number[][];
};
export type ActionItem = {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string;
  due: string;
  done: boolean;
};
export type Decision = {
  id: string;
  title: string;
  reason: string;
  recordedBy: string;
  created: number;
};
export type SharedState = {
  actionItems?: ActionItem[];
  decisions?: Decision[];
  notes: string;
  notesVersion: number;
  transcriptClosedAt?: number;
  polls: Poll[];
  strokes: Stroke[];
  boardPresenter?: { id: string; name: string } | null;
  boardEpoch?: number;
  boardPreviews?: Record<
    string,
    { id: string; name: string; points: number[][]; width: number; expires: number }
  >;
  timer: { endsAt: number; duration: number };
  review: { url: string; task: string };
  browser?: {
    url: string;
    sharedBy: string;
    name: string;
    id?: string;
    annotations?: BrowserStroke[];
  } | null;
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

export type BrowserStroke = { id: string; points: [number, number][] };
