import {cookies} from 'next/headers';
import {query} from './db';
import {opaqueId,digest} from './ids';
import {HttpError} from './errors';
import type {Person} from './types';
const cookie='pg_meet_session';
export async function currentPerson():Promise<Person|null>{const value=(await cookies()).get(cookie)?.value;if(!value)return null;const [person]=await query<Person>('SELECT p.id,p.name,p.account FROM people p JOIN sessions s ON s.person=p.id WHERE s.hash=$1 AND s.expires>$2',[digest(value),Date.now()]);return person||null;}
export async function requirePerson(){const person=await currentPerson();if(!person)throw new HttpError(401,'Please enter your name to continue.');return person;}
export async function createSession(person:string){const raw=opaqueId();const expires=Date.now()+7*86400000;await query('INSERT INTO sessions(hash,person,expires) VALUES($1,$2,$3)',[digest(raw),person,expires]);(await cookies()).set(cookie,raw,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:7*86400});}
export async function revokeSession(){const jar=await cookies();const raw=jar.get(cookie)?.value;if(raw)await query('DELETE FROM sessions WHERE hash=$1',[digest(raw)]);jar.delete(cookie);}
