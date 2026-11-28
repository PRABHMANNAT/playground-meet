import { expect, test } from 'vitest';
import { mergeNote } from '../../src/lib/note-merge';

test('merges independent edits and retains overlapping passages for manual recovery', () => {
  expect(mergeNote('Monday agenda', 'Tuesday agenda', 'Monday agenda!')).toBe('Tuesday agenda!');
  expect(mergeNote('Meet today', 'Meet now', 'Meet Friday')).toBeNull();
  expect(mergeNote('', 'A', 'B')).toBeNull();
  expect(mergeNote('A', 'AB', 'AB')).toBe('AB');
});
