import {WebhookReceiver} from 'livekit-server-sdk';
import {mediaConfig,roomService} from '@/lib/livekit';
import {query} from '@/lib/db';
import {readBody} from '@/lib/read-body';
export async function POST(req:Request){const {key,secret}=mediaConfig();let event;try{event=await new WebhookReceiver(key,secret).receive(await req.text(),req.headers.get('authorization')||'');}catch{return new Response('Invalid signature',{status:401});}
 if(event.event==='participant_joined'&&event.room?.name&&event.participant?.identity){const room=event.room.name,person=event.participant.identity;const [allowed]=await query('SELECT m.person FROM members m JOIN rooms r ON r.id=m.room WHERE m.room=$1 AND m.person=$2 AND m.status=$3 AND r.ended=FALSE',[room,person,'admitted']);if(!allowed){await roomService().removeParticipant(room,person);}}
 return new Response('OK');}
