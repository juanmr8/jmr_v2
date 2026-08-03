# Issue tracker: Linear

Issues and PRDs for this repo live in Linear — team **JMR**, issue prefix **AD** — not GitHub Issues. Linear's project status is the stage of record; use the Linear MCP tools (`mcp__linear-server__*`) for all operations. GitHub is code hosting only — branches, PRs, CI. `gh` stays for PR operations; `gh issue` is not used.

## Conventions

- Sessions normally start from a Session prompt naming a Linear issue.
  Otherwise, list the open issues in this product's current Linear project.
- **Start work**: set the issue to In Progress and restate scope before touching anything.
- **Create an issue**: `save_issue` with `team: "JMR"`, a `title`, and the relevant `project`, assigned to "me". End it with a Session prompt section. Use real newlines in Markdown bodies, not escape sequences.
- **Read an issue**: `get_issue` with the identifier (e.g. `AD-117`), plus `list_comments` for the discussion.
- **List issues**: `list_issues` filtered by `project`, `state`, `label`, or `assignee` as appropriate.
- **Comment on an issue**: `save_comment` with `issueId`.
- **Apply / remove labels**: `save_issue` with `labels` (note: it replaces the full label set — include the labels you want to keep).
- **Blocking edges**: use native relations — `save_issue` with `blockedBy` / `blocks` — not text in the description.
- **Close**: `save_issue` with `state: "Done"` and a closing comment recording what was done; use `state: "Canceled"` for wontfix.

## When a skill says "publish to the issue tracker"

Create Linear issues in this product's current Linear project, assigned to "me" — blockers first so edges can reference real AD identifiers.

## When a skill says "fetch the relevant ticket"

Run `get_issue` on the AD identifier and `list_comments` for its thread.
