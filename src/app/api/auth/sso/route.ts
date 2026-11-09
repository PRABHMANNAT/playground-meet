import {api,body,sameOrigin} from '@/lib/http';
import {verifySSO} from '@/lib/sso';
import {query,transaction} from '@/lib/db';
import {createSession,revokeSession} from '@/lib/session';
import {digest} from '@/lib/ids';
import {limit} from '@/lib/rate-limit';
import {HttpError} from '@/lib/errors';
export const POST=(req:Request)=>api(async()=>{sameOrigin(req);await limit('sso-global',200);const {token}=await body(req);if(typeof token!=='string'||token.length>4096)throw new HttpError(400,'Invalid SSO token.');const p=await verifySSO(token,process.env.PLAYGROUND_SSO_SECRET||'');const id='pg_'+digest(p.sub!);await transaction(async db=>{const used=await db.query('INSERT INTO sso_nonces(id,expires) VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING id',[p.jti,Number(p.exp)*1000]);if(!used.rows.length)throw new HttpError(409,'This sign-in link has already been used.');await db.query('INSERT INTO people(id,name,account) VALUES($1,$2,TRUE) ON CONFLICT(id) DO UPDATE SET name=$2',[id,p.name]);});await revokeSession();await createSession(id);return {ok:true};});
