import type { Handler } from './context';
import { invariant } from '../errors';

export const browser: Handler = async ({ room, person }, action) => {
  if (action.type !== 'browser') return;
  if (action.url) {
    room.state.browser = { url: action.url, sharedBy: person.id, name: person.name };
    return;
  }

  const current = room.state.browser;
  if (!current) return;
  invariant(
    current.sharedBy === person.id || room.host === person.id,
    403,
    'Only the host or the person who shared this page can stop sharing it.',
  );
  room.state.browser = null;
};
