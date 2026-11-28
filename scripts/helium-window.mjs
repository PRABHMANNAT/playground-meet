import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function windowAddress(input) {
  if (!input || input.length > 14000) throw new Error('Invalid launch link');
  const link = new URL(input);
  if (
    link.protocol !== 'meet-helium:' ||
    link.host !== 'open' ||
    link.username ||
    link.password ||
    link.pathname !== '/' ||
    link.hash
  )
    throw new Error('Invalid launch link');
  const target = new URL(link.searchParams.get('url'));
  if (
    !['https:', 'http:'].includes(target.protocol) ||
    target.username ||
    target.password ||
    target.href.length > 6500
  )
    throw new Error('Invalid web address');
  return target.href;
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url).toLowerCase() === process.argv[1].toLowerCase()
) {
  if (process.argv.length !== 3) throw new Error('Expected one launch link');
  const target = windowAddress(process.argv[2]);
  const executable = JSON.parse(
    readFileSync(new URL('./helium-install.json', import.meta.url), 'utf8'),
  ).executable;
  const child = spawn(executable, ['--new-window', target], {
    detached: true,
    stdio: 'ignore',
    shell: false,
  });
  child.unref();
}
