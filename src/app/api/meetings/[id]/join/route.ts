import {api,sameOrigin} from '@/lib/http';
import {requirePerson} from '@/lib/session';
import {transaction} from '@/lib/db';
import {getRoom} from '@/lib/authorization';
import {invariant} from '@/lib/errors';
import {limit} from '@/lib/rate-limit';
import type {Meeting} from '@/lib/types';
export const POST=(req:Request,{params}:{params:Promise<{id:string}>})=>api(async()=>{sameOrigin(req);const p=await requirePerson();const {id}=await params;await getRoom(id);await limit('join:'+p.id,30);return transaction(async db=>{const {rows:[r]}=await db.query<Meeting>('SELECT * FROM rooms WHERE id=$1 FOR UPDATE',[id]);invariant(!r.ended,410,'This meeting has ended.');const {rows:[m]}=await db.query<{status:string}>('SELECT status FROM members WHERE room=$1 AND person=$2',[id,p.id]);invariant(m?.status!=='denied',403,'The host has declined your request.');if(m?.status==='admitted')return {status:'admitted'};invariant(!r.locked,423,'This meeting is locked.');const status=r.lobby?'waiting':'admitted';await db.query('INSERT INTO members(room,person,status,joined) VALUES($1,$2,$3,$4) ON CONFLICT(room,person) DO NOTHING',[id,p.id,status,Date.now()]);return {status:m?.status||status};});});
