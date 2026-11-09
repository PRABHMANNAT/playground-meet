import type {Handler} from './context';
export const lock:Handler=async({room},a)=>{if(a.type==='lock')room.locked=a.locked;};
