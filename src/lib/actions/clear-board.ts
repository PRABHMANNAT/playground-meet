import type { Handler } from './context';
export const clearBoard: Handler = async ({ room }) => {
  room.state.strokes = [];
  room.state.boardEpoch = (room.state.boardEpoch ?? 0) + 1;
  room.state.boardPreviews = {};
};
