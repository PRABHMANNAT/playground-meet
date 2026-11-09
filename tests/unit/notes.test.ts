import { test, expect } from 'vitest';
import { notes } from '../../src/lib/actions/notes';
import { context } from './fixtures';
test('two concurrent note editors cannot silently overwrite each other', async () => {
  const c = context();
  await notes(c, { type: 'notes', text: 'First editor', version: 0 });
  await expect(notes(c, { type: 'notes', text: 'Second editor', version: 0 })).rejects.toThrow();
  expect(c.room.state.notes).toBe('First editor');
  await notes(c, { type: 'notes', text: 'Merged draft', version: 1 });
  expect(c.room.state.notesVersion).toBe(2);
});
