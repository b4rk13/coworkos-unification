# Build→Qualify Handoff: TASK-621

Artifact(s):
  - tools/mcp-config-gen/mcp-servers.json
  - tools/mcp-config-gen/generate.js
  - tools/mcp-config-gen/README.md

Implements: TASK-621 card body (no separate design doc — the card itself is the spec)

AC self-check:
  - AC1: PASS (evidence: grepped `tools/mcp-config-gen/` for the literal `SERVICENOW_OAUTH_PASSWORD`/`SERVICENOW_OAUTH_CLIENT_SECRET` values and every other real secret value in the live configs — zero matches; both appear in `mcp-servers.json` only as `{"secretRef": "..."}` pointers. `git check-ignore -v tools/mcp-config-gen/test.bak` confirmed the repo's existing `*.bak` gitignore rule catches any resolved/backup artifact.)
  - AC2: PASS (evidence: `node generate.js --target=desktop` dry run reported `identicalToLive: true` and `otherTopLevelKeysPreserved: true` against the live `claude_desktop_config.json` — the rendered mcpServers block deep-equals (order/whitespace-insensitive compare) what's already on disk.)
  - AC3: PASS (evidence: `node generate.js --target=code` dry run reported `renderedServerNames: ["pad","notion-brain","nowaikit"]`, `addedServerNames: ["nowaikit"]`, and `otherTopLevelKeysPreserved: true` against the live `.claude.json` — the merge only replaces the `mcpServers` key, verified against all other top-level keys including `tipsHistory`/`clientDataCacheSlots`/etc.)
  - AC4: PASS (evidence: could not run `--apply` against the real live files without breaching the card's own scope boundary, so I copied both live configs to a scratch dir and ran `node generate.js --apply` against those copies. It created `fake-code.json.<ISO-timestamp>.bak` and `fake-desktop.json.<ISO-timestamp>.bak` before writing, and printed both `backupPath` values in its JSON report.)
  - AC5: PASS (evidence: recorded `LastWriteTime` of both real live config files before any work — `.claude.json` 2026-09-05 14:04:37, `claude_desktop_config.json` 2026-09-05 09:44:36 — and re-checked after every dry run and after the scratch-copy apply test; both timestamps never changed. Card is set to `qualify`, not `done`, per the card's own scope boundary — David runs the real apply himself.)

Build-time concerns:
  - Secrets are always resolved from the *Desktop* config specifically (it's the current superset holding every real value in plaintext); if a server's only home ever becomes Code-only, the resolver's secret source will need to move too — noted in the README's "Known scope" section.
  - I extended the Code render beyond the card's literal minimum (pad, notion-brain, nowaikit) by structuring `renderTargets.desktop.servers` to cover all 12 servers, but only wired `renderTargets.code.servers` to the three the AC requires — I did not add the other 9 desktop-only servers (Home Assistant, unifi-network/protect, proxmox/proxmox2, playwright, n8n-mcp, github, 1password) into Code's block, since the card's objective sentence ("same capabilities from any Claude product") is broader than AC3's literal check and I didn't want to silently expand Code's tool surface beyond what was asked. Adding them later is a one-line edit to `renderTargets.code.servers` in `mcp-servers.json`.
  - Did not verify against a hypothetically-restarted Claude Code process — this proves the generator's file-merge fidelity only, not that Code would actually load `nowaikit` correctly at runtime (that's David's to confirm after he runs `--apply` and restarts).

Deviation (CONVE-204): no
