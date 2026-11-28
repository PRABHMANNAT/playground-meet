import { randomUUID } from 'node:crypto';
import type { Handler } from './context';
import { invariant } from '../errors';

export const browser: Handler = async ({ room, person }, action) => {
  if (action.type === 'browser-search') {
    room.state.browserSearch = {
      id: randomUUID(),
      sharedBy: person.id,
      name: person.name,
      query: action.query,
      results: action.results,
    };
    return;
  }
  if (action.type === 'browser-stop-search') {
    const search = room.state.browserSearch;
    invariant(search?.id === action.shareId, 409, 'The shared search has changed.');
    invariant(
      search.sharedBy === person.id || room.host === person.id,
      403,
      'Only the presenter or host can stop sharing this search.',
    );
    room.state.browserSearch = null;
    return;
  }
  const current = room.state.browser;
  const canManage = current?.sharedBy === person.id || room.host === person.id;

  if (action.type === 'browser') {
    if (action.url) {
      room.state.browser = {
        id: randomUUID(),
        url: action.url,
        sharedBy: person.id,
        name: person.name,
        annotations: [],
      };
    } else if (current) {
      invariant(
        canManage,
        403,
        'Only the host or the person who shared this page can stop sharing it.',
      );
      room.state.browser = null;
    }
    return;
  }

  if (action.type !== 'browser-annotate' && action.type !== 'browser-clear-annotations') return;
  invariant(
    current && current.id === action.shareId,
    409,
    'The shared page changed. Reopen it to annotate.',
  );
  if (action.type === 'browser-clear-annotations') {
    invariant(
      canManage,
      403,
      'Only the host or the person who shared this page can clear annotations.',
    );
    current.annotations = [];
    return;
  }

  const strokes = (current.annotations ??= []);
  if (strokes.some(({ id }) => id === action.id)) return;
  invariant(
    strokes.length < 64,
    409,
    'Ask the host or presenter to clear the page before adding more marks.',
  );
  strokes.push({ id: action.id, points: action.points });
};
