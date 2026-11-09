import {api} from '@/lib/http';
import {getRoom} from '@/lib/authorization';
import {currentPerson} from '@/lib/session';
import {query} from '@/lib/db';
export const GET=(_req:Request,{params}:{params:Promise<{id:string}>})=>api(async()=>{const {id}=await params;const room=await getRoom(id);const p=await currentPerson();const [m]=p?await query<{status:string}>('SELECT status FROM members WHERE room=$1 AND person=$2',[id,p.id]):[];return {id,title:room.title,ended:room.ended,locked:room.locked,lobby:room.lobby,host:room.host===p?.id,status:m?.status||'new'};});
