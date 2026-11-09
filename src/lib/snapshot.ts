import { query } from './db';
import { authorize } from './authorization';
import type { Person, Member, Event, Snapshot } from './types';
export async function snapshot(id: string, p: Person): Promise<Snapshot> {
  const meeting = await authorize(id, p, false, true);
  const members = await query<Member>(
    'SELECT p.id,p.name,m.status,m.hand,m.joined FROM members m JOIN people p ON p.id=m.person WHERE m.room=$1 ORDER BY m.joined LIMIT 100',
    [id],
  );
  const events = await query<Event>(
    'SELECT * FROM (SELECT id,kind,actor,name,payload,created FROM events WHERE room=$1 ORDER BY id DESC LIMIT 500) e ORDER BY id',
    [id],
  );
  return {
    meeting,
    members: members.map((m) => ({ ...m, joined: Number(m.joined) })),
    events: events.map((e) => ({ ...e, id: Number(e.id), created: Number(e.created) })),
    me: p,
    serverTime: Date.now(),
  };
}
