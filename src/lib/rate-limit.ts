import {query} from './db';
import {HttpError} from './errors';
export async function limit(key:string,max:number,windowMs=60000){
 const now=Date.now();const [row]=await query<{hits:number}>(`INSERT INTO rate_limits(key,hits,reset) VALUES($1,1,$2) ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN rate_limits.reset<$3 THEN 1 ELSE rate_limits.hits+1 END,reset=CASE WHEN rate_limits.reset<$3 THEN $2 ELSE rate_limits.reset END RETURNING hits`,[key,now+windowMs,now]);
 if(row.hits>max)throw new HttpError(429,'Too many requests. Please wait a minute.');
}
