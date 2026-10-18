import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setupRoadmap } from './setup-roadmap.mjs';

function mock(responses) {
  const calls = [];
  const run = args => { calls.push(args); assert.ok(responses.length, 'unexpected mutation'); return responses.shift(); };
  return { run, calls };
}
const repo = { private: false, has_issues: true, archived: false };
const empty = { nodes: [], totalCount: 0 };

test('refuses private repository and existing private roadmap without changing access', () => {
  const privateRepo = mock([{ ...repo, private: true }]);
  assert.throws(() => setupRoadmap(privateRepo.run), /public feedback/);
  assert.equal(privateRepo.calls.length, 1);
  const privateProject = mock([repo, { nodes: [{ title: 'RouteBean roadmap', number: 1 }], totalCount: 1 }, { public: false }]);
  assert.throws(() => setupRoadmap(privateProject.run), /review it manually/);
  assert.ok(privateProject.calls.every(args => !['create', 'edit', 'link'].includes(args[1])));
});

test('incomplete or ambiguous listing cannot create duplicate Projects', () => {
  for (const list of [{ nodes: [], totalCount: 1 }, { nodes: [{ title: 'RouteBean roadmap' }, { title: 'RouteBean roadmap' }], totalCount: 2 }]) {
    const fixture = mock([repo, list]);
    assert.throws(() => setupRoadmap(fixture.run), /Incomplete|Multiple/);
    assert.equal(fixture.calls.length, 2);
  }
});

test('dry run has no writes and repeat setup reuses an existing public roadmap', () => {
  const dry = mock([repo, empty]);
  assert.match(setupRoadmap(dry.run, { dryRun: true }).plan, /No issues/);
  assert.equal(dry.calls.length, 2);
  const fixture = mock([repo, { nodes: [{ title: 'RouteBean roadmap', number: 4 }], totalCount: 1 }, { number: 4, public: true, closed: false, url: 'https://github.com/users/GitDimONE/projects/4' }, null]);
  assert.equal(setupRoadmap(fixture.run).reused, true);
  assert.equal(fixture.calls.length, 4);
  assert.equal(fixture.calls[3][1], 'link');
  assert.equal(fixture.calls[3].at(-1), 'GitDimONE/routebean-feedback');
});

test('creates only an empty roadmap and links only the public feedback repository', () => {
  const fixture = mock([repo, empty, { number: 4 }, null, null, { public: true, closed: false, url: 'https://github.com/users/GitDimONE/projects/4' }]);
  assert.equal(setupRoadmap(fixture.run).reused, false);
  assert.equal(fixture.calls[2][1], 'create');
  assert.ok(fixture.calls[3].includes('PUBLIC'));
  assert.equal(fixture.calls[4].at(-1), 'GitDimONE/routebean-feedback');
  assert.ok(fixture.calls.every(args => !args.includes('item-add')));
});
