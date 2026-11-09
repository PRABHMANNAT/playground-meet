import { snapshot } from './snapshot';
import { query } from './db';
import type { Person, Event } from './types';
export async function summarySnapshot(id: string, person: Person) {
  const data = await snapshot(id, person);
  const events = await query<Event>(
    'SELECT id,kind,actor,name,payload,created FROM events WHERE room=$1 AND kind IN ($2,$3) ORDER BY id',
    [id, 'marker', 'rating'],
  );
  return {
    ...data,
    events: events.map((e) => ({ ...e, id: Number(e.id), created: Number(e.created) })),
  };
}
