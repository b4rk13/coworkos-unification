# mcp-config-gen

Renders Claude Code's (`.claude.json` → top-level `mcpServers`) and Claude Desktop's
(`claude_desktop_config.json` → `mcpServers`) MCP server blocks from one source of truth,
`mcp-servers.json`, so the two surfaces can't drift. Built for TASK-621.

## Why

Claude Code and Claude Desktop read separate MCP config files. As of 2026-09-05, Code only had
`pad` and `notion-brain`; Desktop had those plus ten more, including `nowaikit`. A session running
in Code had no ServiceNow access and fell back to raw Table API calls. David wants the same
capabilities available from either surface, and a fix that survives the next Claude Desktop update
(which is known to wipe its MCP config — root memory `claude-desktop-update-wipes-mcp-config`).

## How it works

- `mcp-servers.json` defines every server once — command, args, env — plus which surfaces
  (`code`, `desktop`) each renders into, listed under `renderTargets`. A server can declare a
  surface-specific override (`pad` and `notion-brain` do, because they already had working
  Code-only launch quirks); everything else renders identically on both surfaces, with Code
  entries getting `"type": "stdio"` added automatically.
- **No secret values live in `mcp-servers.json`.** An env value written as
  `{"secretRef": "<server>.<ENV_KEY>"}` is resolved at render time by reading the real value out
  of the *live* Desktop config — the file that already holds every credential in plaintext. The
  value is held in memory only; it is never written back into the source-of-truth file, never
  cached to disk, and never printed in full (the report redacts any env key matching
  `SECRET|PASSWORD|TOKEN|API_KEY`).
- The generator never regenerates a target file whole. It reads the live file, replaces only the
  `mcpServers` key with the rendered block, and leaves every other top-level key exactly as read
  (`.claude.json` in particular carries far more than `mcpServers` — startup counters, project
  history, `githubRepoPaths` — none of which this tool touches).

## Usage

```bash
node generate.js                    # dry run, both targets, prints a redacted JSON report
node generate.js --target=code      # dry run, one target only
node generate.js --target=desktop
node generate.js --apply            # writes both targets (backs up each file first)
node generate.js --apply --target=desktop
```

Dry run never writes to either target file — read the report's `identicalToLive` /
`addedServerNames` / `otherTopLevelKeysPreserved` fields to see what would change. `--apply` copies
the existing file to `<path>.<ISO-timestamp>.bak` beside it before writing (matches this repo's
`*.bak` gitignore pattern), then prints the backup path.

## Adding or changing a server

Edit `mcp-servers.json`: add/edit the server's entry under `servers`, mark any credential as
`{"secretRef": "<serverName>.<ENV_KEY>"}` if it's a real secret (never paste the value in), and
list the server under `renderTargets.<surface>.servers` for whichever surface(s) it should reach.
Run a dry run before applying.

## Known scope

- Secrets are currently resolved from the **Desktop** config specifically — it's the superset that
  already holds every real value. If a server's only home ever becomes Code-only, its secret
  source will need to move too.
- This tool builds and proves the render; it does not apply on its own. David runs `--apply`
  himself (TASK-621 scope boundary).
