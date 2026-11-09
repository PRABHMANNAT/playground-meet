import {AccessToken,RoomServiceClient} from 'livekit-server-sdk';
import {HttpError} from './errors';
export function mediaConfig(){const url=process.env.LIVEKIT_URL,key=process.env.LIVEKIT_API_KEY,secret=process.env.LIVEKIT_API_SECRET;
 if(!url||!key||!secret)throw new HttpError(503,'Calling is not configured yet. Ask your administrator to connect LiveKit.');
 if(process.env.NODE_ENV==='production'&&(!url.startsWith('wss://')||secret==='secret'||key==='devkey'))throw new HttpError(503,'Production calling needs secure LiveKit credentials.');
 return {url,key,secret};}
export function roomService(){const {url,key,secret}=mediaConfig();return new RoomServiceClient(process.env.LIVEKIT_INTERNAL_URL||url.replace(/^ws/,'http'),key,secret);}
export async function mediaToken(room:string,identity:string,name:string){const {url,key,secret}=mediaConfig();const token=new AccessToken(key,secret,{identity,name,ttl:'2m'});token.addGrant({room,roomJoin:true,canPublish:true,canSubscribe:true,canPublishData:false,canUpdateOwnMetadata:false});return {token:await token.toJwt(),url};}
