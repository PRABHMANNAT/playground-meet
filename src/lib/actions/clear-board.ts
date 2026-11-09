import type {Handler} from './context';
export const clearBoard:Handler=async({room})=>{room.state.strokes=[];};
