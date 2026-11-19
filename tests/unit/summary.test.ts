import { test, expect } from 'vitest';
import { summary } from '../../src/lib/summary';
import { context } from './fixtures';
test('summary preserves authored evidence without fabricating AI conclusions', () => {
  const c = context();
  c.room.created = 1000;
  c.room.state.notes = 'Decision: simplify onboarding';
  const output = summary({
    meeting: c.room,
    members: [],
    me: c.person,
    serverTime: 10000,
    events: [
      {
        id: 1,
        kind: 'marker',
        actor: 'guest',
        name: 'Guest',
        payload: { kind: 'bug', text: 'Button did not respond' },
        created: 62000,
      },
    ],
  });
  expect(output).toContain('Decision: simplify onboarding');
  expect(output).toContain('[01:01]');
  expect(output).toContain('Button did not respond');
  expect(output).toContain('No AI processing');
});

test('discussion highlights retain speaker attribution and full transcript retains every line', () => {
  const c = context();
  const texts = ['hello', 'we agreed to release on friday', 'we agreed to release on friday'];
  const events = texts.map((text, i) => ({
    id: i + 1,
    actor: 'speaker',
    name: 'Mira',
    kind: 'transcript',
    created: c.room.created + i * 1000,
    payload: { text },
  }));
  const markdown = summary({
    meeting: c.room,
    me: c.person,
    events,
    members: [],
    serverTime: Date.now(),
  });
  expect(markdown.split('## Shared notes')[0]).toContain(
    '[00:01] Mira: we agreed to release on friday',
  );
  expect(markdown.split('## Shared notes')[0]).not.toContain('hello');
  expect(markdown.split('## Speaker transcript')[1]).toContain('[00:00] Mira: hello');
  expect(markdown.split('## Speaker transcript')[1]).toContain(
    '[00:02] Mira: we agreed to release on friday',
  );
});
