import { invariant } from '../errors';
import type { Handler } from './context';

export const outcomes: Handler = async ({ db, room, person }, action) => {
  if (action.type === 'decision') {
    const decisions = (room.state.decisions ??= []);
    if (decisions.some((entry) => entry.id === action.id)) return;
    invariant(decisions.length < 250, 409, 'This meeting already has 250 decisions.');
    decisions.push({
      id: action.id,
      title: action.title,
      reason: action.reason,
      recordedBy: person.name,
      created: Date.now(),
    });
  }
  if (action.type === 'action-item') {
    const items = (room.state.actionItems ??= []);
    if (items.some((entry) => entry.id === action.id)) return;
    invariant(items.length < 250, 409, 'This meeting already has 250 action items.');
    const {
      rows: [owner],
    } = await db.query<{ name: string }>(
      "SELECT p.name FROM members m JOIN people p ON p.id=m.person WHERE m.room=$1 AND m.person=$2 AND m.status='admitted'",
      [room.id, action.ownerId],
    );
    invariant(owner, 400, 'Choose an admitted participant as the owner.');
    items.push({
      id: action.id,
      title: action.title,
      ownerId: action.ownerId,
      ownerName: owner.name,
      due: action.due,
      done: false,
    });
  }
  if (action.type === 'action-item-status') {
    const item = room.state.actionItems?.find((entry) => entry.id === action.id);
    invariant(item, 404, 'Action item not found.');
    item.done = action.done;
  }
};
