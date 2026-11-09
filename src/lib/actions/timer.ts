import type {Handler} from './context';
export const timer:Handler=async({room},a)=>{if(a.type!=='timer')return;room.state.timer={duration:a.seconds,endsAt:a.seconds?Date.now()+a.seconds*1000:0};};
