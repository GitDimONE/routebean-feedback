# Maintaining feedback and the public roadmap

1. Review new `needs-triage` reports. Keep `bug` / `enhancement`; request
   `needs-info` when necessary, then remove `needs-triage` after review.
2. Acknowledge the user in their chosen language where possible. Close duplicates
   with a link to the public original, or explain why a request is declined.
3. Select real, reviewed public product requests for `roadmap`. Use at most one
   of `planned`, `in-progress`, `shipped`. Add `planned` only after a product
   decision; mark `shipped` only after release. Do not publish dates by default.
4. Keep private reports and implementation repositories private. Never mirror
   private issue bodies, attachments, internal links, or repository names. If a
   private request warrants a public entry, deliberately write a safe summary
   with the reporter's consent; the private report remains private.

## Public GitHub Project

The live [RouteBean roadmap](https://github.com/users/GitDimONE/projects/2) is public.
The setup command below safely reuses it.
Project creation requires a GitHub session with Projects write access. With the
GitHub CLI, the account owner can authorize it using `gh auth refresh -s project`.
Do not change implementation repository visibility or grant the feedback broker
additional permissions.

Run `node scripts/setup-roadmap.mjs --dry-run`, then
`node scripts/setup-roadmap.mjs`. The script reuses an existing public roadmap,
refuses to expose an existing private Project, and otherwise creates an empty
public **RouteBean roadmap** linked only to this repository. It imports no issues.
Run `node --test scripts/setup-roadmap.test.mjs` for the setup safety checks.

Use the default Status
field: **Todo** (planned), **In Progress**, **Done** (shipped). Add only reviewed
public issues carrying `roadmap`; leave automatic import disabled. No invented
commitments or historical test/outage entries are needed.

Check the Project signed out after changes: only approved public-facing entries should appear.
Keep private implementation issues outside this Project, even though GitHub
hides private-repository items from visitors without access.

## Automation

`triage.yml` labels new bug/feature reports `needs-triage`, including reports
created by the in-app broker. It excludes outages and reads no report content.
It neither sends messages nor adds Project entries. Triage remains a maintainer
decision; no existing report is relabelled automatically during setup.
