import { randomUUID } from 'node:crypto';
import type { Handler } from './context';
import { invariant } from '../errors';
export const notes: Handler = async ({ room, person }, a) => {
  const current = room.state.liveNote;
  if (a.type === 'note-share') {
    invariant(!current, 409, 'A note is already on stage.');
    room.state.liveNote = {
      id: randomUUID(),
      owner: person.id,
      name: person.name,
      text: a.text,
      version: 0,
      editable: false,
    };
    return;
  }
  if (a.type === 'note-edit' || a.type === 'note-access' || a.type === 'note-stop') {
    invariant(current?.id === a.id, 409, 'This note is no longer on stage.');
    const owner = current.owner === person.id;
    if (a.type === 'note-edit') {
      invariant(owner || current.editable, 403, 'The presenter has limited editing.');
      invariant(current.version === a.version, 409, 'A newer edit is available.');
      current.text = a.text;
      current.version++;
    } else if (a.type === 'note-access') {
      invariant(owner, 403, 'Only the presenter can change editing access.');
      current.editable = a.editable;
    } else {
      invariant(
        owner || room.host === person.id,
        403,
        'Only the presenter or host can stop sharing.',
      );
      room.state.liveNote = null;
    }
    return;
  }
  if (a.type !== 'notes') return;
  invariant(
    a.version === room.state.notesVersion,
    409,
    'Someone updated the notes. Copy your draft, then reload the latest notes.',
  );
  room.state.notes = a.text;
  room.state.notesVersion++;
};
