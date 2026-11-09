import type { Handler } from './context';
import { invariant } from '../errors';
export const vote: Handler = async ({ room, person }, a) => {
  if (a.type !== 'vote') return;
  const poll = room.state.polls.find((p) => p.id === a.pollId);
  invariant(poll && !poll.closed, 409, 'This poll is closed or unavailable.');
  invariant(a.option < poll.options.length, 400, 'Invalid poll option.');
  poll.votes[person.id] = a.option;
};
