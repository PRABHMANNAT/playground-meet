'use client';
import {AnimatePresence,motion} from 'motion/react';import type {Event} from '@/lib/types';
export const emojis=['👏','❤️','🎉','👍','💡','😂'] as const;
export function Reactions({events,now}:{events:Event[];now:number}){return <div aria-live="polite" aria-label="Meeting reactions"><AnimatePresence>{events.filter(e=>e.kind==='reaction'&&now-e.created<4000).map(e=><motion.div className="reaction-rain" key={e.id} initial={{y:0,opacity:0,scale:.5}} animate={{y:-150,opacity:1,scale:1.2}} exit={{y:-220,opacity:0}} transition={{duration:1.6}} style={{left:`${25+e.id%50}%`}} title={e.name}><span aria-label={`${e.name} reacted`}>{String(e.payload.emoji)}</span></motion.div>)}</AnimatePresence></div>;}
