import type { Handler } from './context';
import { invariant } from '../errors';
export const stroke: Handler = async ({ room, person }, a) => {
  if (a.type !== 'stroke') return;
  if (room.state.strokes.some((s) => s.id === a.id)) return;
  invariant(room.state.strokes.length < 500, 409, 'Whiteboard is full. Ask the host to clear it.');
  room.state.strokes.push({ id: a.id, author: person.id, color: a.color, points: a.points });
};
