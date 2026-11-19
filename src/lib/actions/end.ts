import type { Handler } from './context';
export const end: Handler = async ({ room }) => {
  room.ended = true;
  room.state.boardPresenter = null;
  room.state.boardPreviews = {};
  room.state.browser = null;
};
