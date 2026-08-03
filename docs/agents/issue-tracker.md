# Issue tracker: Linear

Issues and PRDs for this repo live in Linear — team **JMR**, issue prefix **AD**. Use the Linear MCP tools (`mcp__linear-server__*`) for all operations.

## Conventions

- **Create an issue**: `save_issue` with `team: "JMR"`, a `title`, and the relevant `project`. Use real newlines in Markdown bodies, not escape sequences.
- **Read an issue**: `get_issue` with the identifier (e.g. `AD-117`), plus `list_comments` for the discussion.
- **List issues**: `list_issues` filtered by `project`, `state`, `label`, or `assignee` as appropriate.
- **Comment on an issue**: `save_comment` with `issueId`.
- **Apply / remove labels**: `save_issue` with `labels` (note: it replaces the full label set — include the labels you want to keep).
- **Blocking edges**: use native relations — `save_issue` with `blockedBy` / `blocks` — not text in the description.
- **Close**: `save_issue` with `state: "Done"` and a closing comment; use `state: "Canceled"` for wontfix.

## When a skill says "publish to the issue tracker"

Create Linear issues in the relevant project (team JMR), blockers first so edges can reference real AD identifiers.

## When a skill says "fetch the relevant ticket"

Run `get_issue` on the AD identifier and `list_comments` for its thread.
