import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const expected = Number(process.argv[2] || 160);
const commits = git('rev-list', '--reverse', 'HEAD').split('\n');
assert.equal(commits.length, expected, `Expected ${expected} commits`);
for (const commit of commits) {
  const changes = git('diff-tree', '--root', '--no-commit-id', '--name-only', '-r', commit);
  assert.ok(changes.length, `Empty commit found: ${commit}`);
}
const tracked = git('ls-files').split('\n');
const privateFiles = tracked.filter(
  (path) =>
    (path.startsWith('.env') && path !== '.env.example') ||
    path.startsWith('.work/') ||
    path.startsWith('.data/') ||
    path.endsWith('.generated.yaml'),
);
assert.deepEqual(privateFiles, [], 'Private local files must not be tracked');
const origin = git('remote', 'get-url', 'origin');
assert.ok(origin.endsWith('PRABHMANNAT/playground-meet.git'), 'Unexpected delivery repository');
console.log(
  `Verified ${commits.length} non-empty commits and no tracked local secrets/runtime data.`,
);
console.log('Semantic quality remains a human review; this check does not claim to measure it.');
