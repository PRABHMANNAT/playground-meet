import {api,sameOrigin} from '@/lib/http';
import {requirePerson} from '@/lib/session';
import {authorize} from '@/lib/authorization';
import {mediaToken} from '@/lib/livekit';
import {limit} from '@/lib/rate-limit';
export const POST=(req:Request,{params}:{params:Promise<{id:string}>})=>api(async()=>{sameOrigin(req);const p=await requirePerson();const {id}=await params;await limit('token:'+p.id,30);await authorize(id,p);return mediaToken(id,p.id,p.name);});
