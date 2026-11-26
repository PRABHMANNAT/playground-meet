import type { Handler } from './context';
export const timer: Handler = async ({ room }, a) => {
  const current = room.state.timer;
  const now = Date.now();
  if (a.type === 'timer') {
    room.state.timer = { duration: a.seconds, endsAt: a.seconds ? now + a.seconds * 1000 : 0 };
  } else if (a.type === 'timer-control') {
    if (a.operation === 'pause' && current.endsAt > now) {
      current.pausedSeconds = Math.ceil((current.endsAt - now) / 1000);
      current.endsAt = 0;
    } else if (a.operation === 'resume' && current.pausedSeconds) {
      current.endsAt = now + current.pausedSeconds * 1000;
      delete current.pausedSeconds;
    }
  }
};
