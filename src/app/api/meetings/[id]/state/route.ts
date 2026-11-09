import {api} from '@/lib/http';
import {requirePerson} from '@/lib/session';
import {snapshot} from '@/lib/snapshot';
export const GET=(_req:Request,{params}:{params:Promise<{id:string}>})=>api(async()=>snapshot((await params).id,await requirePerson()));
