# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to how the Linear workspace (team JMR) actually expresses them — some map to labels, some to workflow states.

| Label in mattpocock/skills | In our tracker (Linear)      | Meaning                                  |
| -------------------------- | ---------------------------- | ---------------------------------------- |
| `needs-triage`             | **Triage** status            | Maintainer needs to evaluate this issue  |
| `needs-info`               | Comment @-mentioning Juan; leave in **Triage** | Waiting on reporter for more information |
| `ready-for-agent`          | `AFK` label                  | Fully specified; Claude executes solo, Juan reviews after |
| `ready-for-human`          | `Human-in-the-loop` label    | Execution needs Juan present             |
| `wontfix`                  | **Canceled** status          | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label or state from this table.

Other workspace labels in use: `Feature`, `Improvement`, `Bug`, `Grill` (decision-shaping interview session), `Today`, `Ad Hoc`.
