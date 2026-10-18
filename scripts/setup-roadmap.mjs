#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const owner = 'GitDimONE';
const repository = `${owner}/routebean-feedback`;
const title = 'RouteBean roadmap';

export function setupRoadmap(run, { dryRun = false } = {}) {
  const metadata = run(['api', `repos/${repository}`]);
  if (metadata.private !== false || metadata.archived || !metadata.has_issues) {
    throw new Error('Expected the active public feedback repository; no changes made.');
  }
  const result = run(['project', 'list', '--owner', owner, '--limit', '1000', '--format', 'json']);
  if (result.projects.length !== result.totalCount) throw new Error('Incomplete Project list; refusing to create a duplicate.');
  const matches = result.projects.filter(project => project.title === title);
  if (matches.length > 1) throw new Error('Multiple matching Projects; select the intended Project manually.');
  if (matches.length) {
    const project = run(['project', 'view', String(matches[0].number), '--owner', owner, '--format', 'json']);
    if (!project.public || project.closed) throw new Error('Existing roadmap is private or closed; review it manually before changing access.');
    if (!dryRun) run(['project', 'link', String(project.number), '--owner', owner, '--repo', repository]);
    return { url: project.url, reused: true };
  }
  if (dryRun) return { plan: `Create an empty public ${title} linked only to ${repository}. No issues will be imported.` };
  const project = run(['project', 'create', '--owner', owner, '--title', title, '--format', 'json']);
  // A new Project is empty. Publish only this newly created surface; never expose an existing private Project.
  run(['project', 'edit', String(project.number), '--owner', owner,
    '--description', 'Reviewed public product requests. Plans may change; no delivery dates are promised.',
    '--readme', 'Only deliberately selected public RouteBean feedback belongs here. Todo means planned, In Progress means work has started, Done means shipped. Private reports and implementation issues stay private. An empty roadmap means no items have been published yet.',
    '--visibility', 'PUBLIC']);
  run(['project', 'link', String(project.number), '--owner', owner, '--repo', repository]);
  const verified = run(['project', 'view', String(project.number), '--owner', owner, '--format', 'json']);
  if (!verified.public || verified.closed) throw new Error('Project created but public visibility could not be verified.');
  return { url: verified.url, reused: false };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = process.argv.slice(2);
    if (args.some(arg => arg !== '--dry-run')) throw new Error('Usage: node scripts/setup-roadmap.mjs [--dry-run]');
    const run = args => {
      const output = execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      return output.trim() ? JSON.parse(output) : null;
    };
    console.log(JSON.stringify(setupRoadmap(run, { dryRun: args.includes('--dry-run') }), null, 2));
  } catch (error) {
    console.error(error.stderr?.toString().trim() || error.message);
    process.exitCode = 1;
  }
}
