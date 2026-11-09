import type { Handler } from './context';
export const end: Handler = async ({ room }) => {
  room.ended = true;
};
