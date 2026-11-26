import type { SharedState } from './types';

export function timerSeconds(timer: SharedState['timer'], serverNow: number) {
  return (
    timer.pausedSeconds ??
    Math.max(0, Math.min(timer.duration, Math.ceil((timer.endsAt - serverNow) / 1000)))
  );
}
