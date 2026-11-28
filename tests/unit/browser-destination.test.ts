import { expect, test } from 'vitest';
import { browserDestination } from '../../src/lib/browser-destination';
test('opens real websites and treats search terms as text', () => {
  expect(browserDestination('github.com/imputnet/helium')).toBe(
    'https://github.com/imputnet/helium',
  );
  expect(browserDestination('http://localhost:3000/demo')).toBe('http://localhost:3000/demo');
  expect(browserDestination('design & type')).toBe('https://duckduckgo.com/?q=design%20%26%20type');
  for (const value of [
    'javascript:alert(1)',
    'file:///tmp/a',
    '//example.org',
    'https://user:pass@example.org',
    '',
  ])
    expect(browserDestination(value)).toBeNull();
});
