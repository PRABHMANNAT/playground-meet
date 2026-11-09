import assert from 'node:assert/strict';
export const base = process.env.TEST_BASE_URL || 'http://localhost:3000';
export class Client {
  cookie = '';
  async call(path: string, data?: unknown, expected = 200, method?: string) {
    const r = await fetch(base + path, {
      method: method || (data === undefined ? 'GET' : 'POST'),
      headers: {
        Origin: base,
        ...(data === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(this.cookie ? { Cookie: this.cookie } : {}),
      },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
    const cookie = r.headers.get('set-cookie');
    if (cookie) this.cookie = cookie.split(';')[0];
    const body = await r.json();
    assert.equal(r.status, expected, `${path}: ${JSON.stringify(body)}`);
    return body;
  }
}
