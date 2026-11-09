import {query} from '@/lib/db';
export async function GET(){try{await query('SELECT 1');return Response.json({status:'ok',callingConfigured:Boolean(process.env.LIVEKIT_URL&&process.env.LIVEKIT_API_KEY&&process.env.LIVEKIT_API_SECRET)},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({status:'unavailable'},{status:503});}}
