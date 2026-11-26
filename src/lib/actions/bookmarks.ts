import type { Handler } from './context';
import { invariant } from '../errors';

export const bookmarks: Handler = async ({ room, person }, action) => {
  const entries = (room.state.bookmarks ??= []);
  if (action.type === 'bookmark') {
    if (entries.some((entry) => entry.id === action.id)) return;
    invariant(entries.length < 250, 409, 'This meeting already has 250 bookmarks.');
    entries.push({
      id: action.id,
      label: action.label,
      created: Date.now(),
      author: person.id,
      name: person.name,
    });
  } else if (action.type === 'remove-bookmark') {
    const entry = entries.find((item) => item.id === action.id);
    if (!entry) return;
    invariant(
      person.id === entry.author || person.id === room.host,
      403,
      'Only the author or host can remove this bookmark.',
    );
    room.state.bookmarks = entries.filter((item) => item.id !== action.id);
  }
};
