import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import { BrowserPanel, type BrowserTabId } from '../../src/components/panels/browser';
import { context } from './fixtures';

function renderPanel(url: string | null, selected: BrowserTabId, visible = true) {
  const { room, person } = context();
  room.state.browser = url ? { url, name: 'Presenter', sharedBy: 'presenter' } : null;
  return renderToStaticMarkup(
    createElement(BrowserPanel, {
      data: { meeting: room, me: person, members: [], events: [], serverTime: 0 },
      host: false,
      send: vi.fn(),
      visible,
      controls: { selected, select: vi.fn(), present: vi.fn(), presenting: false },
    }),
  );
}

test('opening the room tab previews the current shared URL, including older shares without IDs', () => {
  for (const url of ['https://example.com/', 'https://example.org/']) {
    const html = renderPanel(url, 'shared');
    expect(html).toContain('src="' + url + '"');
    expect(html).toContain('Shared by Presenter');
    expect(html).not.toContain('Stop sharing page');
  }
});

test('a private tab, a closed panel and an ended share do not load the remote page', () => {
  expect(renderPanel('https://example.com/', 1)).not.toContain('<iframe');
  expect(renderPanel('https://example.com/', 'shared', false)).not.toContain('<iframe');
  expect(renderPanel(null, 'shared')).not.toContain('<iframe');
});

test('Google search opens externally while an explicit Maps embed can still preview', () => {
  const html = renderPanel('https://www.google.com/search?q=maps', 'shared');
  expect(html).not.toContain('<iframe');
  expect(html).toContain('href="https://www.google.com/search?q=maps"');
  expect(html).toContain('Choose tab or window');
  expect(renderPanel('https://www.google.com/maps/embed?pb=test', 'shared')).toContain('<iframe');
});
