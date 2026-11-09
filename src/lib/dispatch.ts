import {transaction} from './db';
import {getRoom} from './authorization';
import {handlers,hostActions} from './actions';
import {invariant} from './errors';
import {roomService} from './livekit';
import type {Action} from './schemas';
import type {Meeting,Person} from './types';
export async function dispatch(id:string,person:Person,action:Action){await getRoom(id);await transaction(async db=>{
 const {rows:[room]}=await db.query<Meeting>('SELECT * FROM rooms WHERE id=$1 FOR UPDATE',[id]);
 invariant(!room.ended||action.type==='rating',410,'This meeting has ended.');
 const {rows:[member]}=await db.query<{status:string}>('SELECT status FROM members WHERE room=$1 AND person=$2',[id,person.id]);invariant(member?.status==='admitted',403,'You do not have access to this meeting.');
 invariant(!hostActions.has(action.type)||room.host===person.id,403,'Only the host can do that.');
 if(action.type==='mute'){const {rows:[target]}=await db.query('SELECT person FROM members WHERE room=$1 AND person=$2 AND status=$3',[id,action.memberId,'admitted']);invariant(target,404,'Participant not found.');}
 await handlers[action.type]({db,room,person},action);
 await db.query('UPDATE rooms SET state=$1,ended=$2,locked=$3,lobby=$4,revision=revision+1 WHERE id=$5',[JSON.stringify(room.state),room.ended,room.locked,room.lobby,id]);
 const payload=action.type==='notes'||action.type==='stroke'?{}:action;
 await db.query('INSERT INTO events(room,kind,actor,name,payload,created) VALUES($1,$2,$3,$4,$5,$6)',[id,action.type,person.id,person.name,JSON.stringify(payload),Date.now()]);
 });
 let warning:string|undefined;
 if(['remove','mute','end'].includes(action.type)){try{const service=roomService();if(action.type==='end')await service.deleteRoom(id);if(action.type==='remove'){await service.updateParticipant(id,action.memberId,undefined,{canPublish:false,canSubscribe:false,canPublishData:false});await service.removeParticipant(id,action.memberId);}if(action.type==='mute'){const p=await service.getParticipant(id,action.memberId);for(const track of p.tracks.filter(t=>t.type===0))await service.mutePublishedTrack(id,action.memberId,track.sid,true);}}catch{warning='Access policy was saved, but the media server could not confirm this control. Retry if the participant is still connected.';}}
 return {ok:true,warning};
}
