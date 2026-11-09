import type {Handler} from './context';
export const lobby:Handler=async({room},a)=>{if(a.type==='lobby')room.lobby=a.enabled;};
