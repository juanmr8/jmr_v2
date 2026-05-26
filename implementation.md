# Claude Code Status Line — Setup

Status line shows: `repo/path | branch | <tokens> | <percentage>`

## Prereqs

```sh
npm install -g ccstatusline
```

## Files

### `~/.config/ccstatusline/settings.json`

```json
{
  "version": 3,
  "lines": [
    [
      { "id": "2", "type": "context-length", "color": "yellow", "bold": true, "rawValue": true },
      { "id": "3", "type": "custom-text", "customText": " | ", "color": "white" },
      { "id": "1", "type": "context-percentage", "color": "brightBlack", "rawValue": true }
    ],
    [],
    []
  ],
  "flexMode": "full-minus-40",
  "compactThreshold": 60,
  "colorLevel": 2,
  "inheritSeparatorColors": false,
  "globalBold": false,
  "powerline": {
    "enabled": false,
    "separators": [""],
    "separatorInvertBackground": [false],
    "startCaps": [],
    "endCaps": [],
    "autoAlign": false
  }
}
```

### `~/.claude/statusline-command.sh`

```bash
#!/bin/bash
input=$(cat)
cwd=$(echo "$input" | sed -n 's/.*"current_dir":"\([^"]*\)".*/\1/p')

if git -C "$cwd" rev-parse --git-dir > /dev/null 2>&1; then
  repo_name=$(echo "$cwd" | sed "s|^$HOME/Dev/||")
  branch=$(git -C "$cwd" --no-optional-locks rev-parse --abbrev-ref HEAD 2>/dev/null)
  printf '\033[01;36m%s\033[00m | \033[01;32m%s\033[00m' "$repo_name" "$branch"
else
  printf '\033[01;36m%s\033[00m' "$cwd"
fi
```

> Change `$HOME/Dev/` to wherever your repos live.

### `~/.claude/statusline-wrapper.sh`

```bash
#!/bin/bash
input=$(cat)
git_info=$(echo "$input" | bash ~/.claude/statusline-command.sh)
context_pct=$(echo "$input" | npx ccstatusline)
printf '%s | %s' "$git_info" "$context_pct"
```

### `~/.claude/settings.json`

Add:

```json
{
  "statusLine": {
    "type": "command",
    "command": "bash ~/.claude/statusline-wrapper.sh"
  }
}
```

## Activate

```sh
chmod +x ~/.claude/statusline-command.sh ~/.claude/statusline-wrapper.sh
```

Restart Claude Code.
