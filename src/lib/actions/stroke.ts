import type { Handler } from './context';
import { invariant } from '../errors';
export const stroke: Handler = async ({ room, person }, a) => {
  const state = room.state;
  if (a.type === 'board-share') {
    const presenter = state.boardPresenter;
    if (a.active) {
      invariant(
        !presenter || presenter.id === person.id,
        409,
        'The whiteboard is already being presented.',
      );
      state.boardPresenter = { id: person.id, name: person.name };
    } else {
      invariant(
        !presenter || presenter.id === person.id || room.host === person.id,
        403,
        'Only the presenter or host can stop sharing.',
      );
      state.boardPresenter = null;
    }
    return;
  }
  if (a.type === 'board-undo') {
    const index = state.strokes.findIndex((s) => s.id === a.id);
    if (index === -1) return;
    invariant(state.strokes[index].author === person.id, 403, 'You can undo your own marks.');
    state.strokes.splice(index, 1);
    return;
  }
  if (a.type === 'board-preview') {
    if (a.epoch !== (state.boardEpoch ?? 0) || state.strokes.some((s) => s.id === a.id)) return;
    const previews = (state.boardPreviews ??= {});
    for (const [key, p] of Object.entries(previews))
      if (p.expires <= Date.now()) delete previews[key];
    previews[person.id] = {
      id: a.id,
      name: person.name,
      points: a.points,
      width: a.width,
      expires: Date.now() + 4500,
    };
    return;
  }
  if (a.type !== 'stroke') return;
  invariant(
    a.epoch === undefined || a.epoch === (state.boardEpoch ?? 0),
    409,
    'The whiteboard was cleared. Draw again.',
  );
  if (state.boardPreviews?.[person.id]?.id === a.id) delete state.boardPreviews[person.id];
  if (room.state.strokes.some((s) => s.id === a.id)) return;
  invariant(room.state.strokes.length < 500, 409, 'Whiteboard is full. Ask the host to clear it.');
  room.state.strokes.push({
    id: a.id,
    author: person.id,
    name: person.name,
    wide: a.wide,
    width: a.width,
    color: a.color,
    points: a.points,
  });
};
