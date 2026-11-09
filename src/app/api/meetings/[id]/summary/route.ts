import {api} from '@/lib/http';
import {requirePerson} from '@/lib/session';
import {summarySnapshot as snapshot} from '@/lib/summary-snapshot';
import {summary} from '@/lib/summary';
export const GET=(_req:Request,{params}:{params:Promise<{id:string}>})=>api(async()=>({markdown:summary(await snapshot((await params).id,await requirePerson()))}));
