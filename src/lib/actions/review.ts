import type {Handler} from './context';
export const review:Handler=async({room},a)=>{if(a.type!=='review')return;room.state.review={url:a.url,task:a.task};};
