import type {Handler} from './context';
import {invariant} from '../errors';
export const closePoll:Handler=async({room},a)=>{if(a.type!=='close-poll')return;const poll=room.state.polls.find(p=>p.id===a.pollId);invariant(poll,404,'Poll not found.');poll.closed=true;};
