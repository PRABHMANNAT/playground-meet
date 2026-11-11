import { chat } from './chat';
import { hand } from './hand';
import { notes } from './notes';
import { poll } from './poll';
import { vote } from './vote';
import { closePoll } from './close-poll';
import { stroke } from './stroke';
import { clearBoard } from './clear-board';
import { timer } from './timer';
import { review } from './review';
import { browser } from './browser';
import { admit } from './admit';
import { remove } from './remove';
import { lock } from './lock';
import { lobby } from './lobby';
import { end } from './end';
import { rating } from './rating';
import type { Handler } from './context';
import type { Action } from '../schemas';
export const handlers: Record<Action['type'], Handler> = {
  chat,
  reaction: chat,
  marker: chat,
  hand,
  notes,
  poll,
  vote,
  'close-poll': closePoll,
  stroke,
  'clear-board': clearBoard,
  timer,
  review,
  browser,
  admit,
  remove,
  mute: chat,
  lock,
  lobby,
  end,
  rating,
};
export const hostActions = new Set<Action['type']>([
  'poll',
  'close-poll',
  'clear-board',
  'timer',
  'review',
  'admit',
  'remove',
  'mute',
  'lock',
  'lobby',
  'end',
]);
