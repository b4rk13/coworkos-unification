#!/usr/bin/env node
'use strict';
/**
 * Renders Claude Code's (.claude.json) and Claude Desktop's (claude_desktop_config.json)
 * mcpServers blocks from one source of truth (mcp-servers.json), so the two surfaces can't drift.
 *
 * Secrets never live in mcp-servers.json — an env value of {"secretRef": "<server>.<ENV_KEY>"}
 * is resolved at render time by reading the real value out of the live Desktop config, which is
 * already the superset holding every credential in plaintext. Nothing secret is ever written to
 * a tracked file, printed in full, or cached to disk.
 *
 * Usage:
 *   node generate.js                    dry run, both targets, prints a redacted report
 *   node generate.js --target=code      dry run, one target only
 *   node generate.js --apply            writes both targets (backs up first)
 *   node generate.js --apply --target=desktop
 */
const fs = require('fs');
const path = require('path');

const CODE_PATH = 'C:\\Users\\david\\.claude.json';
const DESKTOP_PATH =
  'C:\\Users\\david\\AppData\\Local\\Packages\\Claude_pzs8sxrjxfjjc\\LocalCache\\Roaming\\Claude\\claude_desktop_config.json';
const SOURCE_OF_TRUTH_PATH = path.join(__dirname, 'mcp-servers.json');

const SECRET_KEY_PATTERN = /SECRET|PASSWORD|TOKEN|API_KEY|PERSONAL_ACCESS_TOKEN/i;

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function loadSourceOfTruth() {
  return readJson(SOURCE_OF_TRUTH_PATH);
}

// Secrets are always resolved from the live Desktop config, regardless of which
// surface is being rendered — it's the one file that already holds every real value.
function makeSecretResolver(desktopLive) {
  return function resolve(ref) {
    const dot = ref.indexOf('.');
    const serverName = ref.slice(0, dot);
    const envKey = ref.slice(dot + 1);
    const server = desktopLive.mcpServers && desktopLive.mcpServers[serverName];
    if (!server || !server.env || !(envKey in server.env)) {
      throw new Error(`Cannot resolve secretRef "${ref}" — not found in live Desktop config`);
    }
    return server.env[envKey];
  };
}

function renderEnv(envDef, resolveSecret) {
  if (!envDef) return undefined;
  const out = {};
  for (const [k, v] of Object.entries(envDef)) {
    out[k] = v && typeof v === 'object' && 'secretRef' in v ? resolveSecret(v.secretRef) : v;
  }
  return out;
}

function renderServer(def, surfaceKey, resolveSecret, wrapType) {
  const surfaceDef = def[surfaceKey];
  if (!surfaceDef) return null;
  const rendered = {};
  if (wrapType) rendered.type = wrapType;
  rendered.command = surfaceDef.command;
  rendered.args = surfaceDef.args;
  const env = renderEnv(surfaceDef.env, resolveSecret);
  if (env !== undefined) rendered.env = env;
  return rendered;
}

function renderMcpServers(sot, targetName, resolveSecret) {
  const target = sot.renderTargets[targetName];
  const out = {};
  for (const serverName of target.servers) {
    const def = sot.servers[serverName];
    if (!def) throw new Error(`Unknown server "${serverName}" listed in renderTargets.${targetName}`);
    // A server may declare a surface-specific override (e.g. "code"); otherwise
    // every surface renders from its "desktop" definition.
    const surfaceKey = def[targetName] ? targetName : 'desktop';
    const rendered = renderServer(def, surfaceKey, resolveSecret, target.wrapType);
    if (!rendered) throw new Error(`Server "${serverName}" has no "${surfaceKey}" definition`);
    out[serverName] = rendered;
  }
  return out;
}

function redactMcpServers(mcpServers) {
  const clone = JSON.parse(JSON.stringify(mcpServers || {}));
  for (const server of Object.values(clone)) {
    if (server.env) {
      for (const k of Object.keys(server.env)) {
        if (SECRET_KEY_PATTERN.test(k)) server.env[k] = '***REDACTED***';
      }
    }
  }
  return clone;
}

// Deep-sorts object keys (arrays keep their order) so two structurally-identical
// objects compare equal regardless of key order or serialization whitespace.
function canonicalize(obj) {
  if (Array.isArray(obj)) return obj.map(canonicalize);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const k of Object.keys(obj).sort()) out[k] = canonicalize(obj[k]);
    return out;
  }
  return obj;
}

function deepEqual(a, b) {
  return JSON.stringify(canonicalize(a)) === JSON.stringify(canonicalize(b));
}

function backupFile(targetPath) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${targetPath}.${stamp}.bak`;
  fs.copyFileSync(targetPath, backupPath);
  return backupPath;
}

function main() {
  const argv = process.argv.slice(2);
  const apply = argv.includes('--apply');
  const targetArg = (argv.find((a) => a.startsWith('--target=')) || '--target=all').split('=')[1];
  const targets = targetArg === 'all' ? ['code', 'desktop'] : [targetArg];

  const sot = loadSourceOfTruth();
  const desktopLive = readJson(DESKTOP_PATH);
  const resolveSecret = makeSecretResolver(desktopLive);

  const results = [];

  for (const targetName of targets) {
    const targetPath = targetName === 'code' ? CODE_PATH : DESKTOP_PATH;
    const before = readJson(targetPath);
    const beforeMtime = fs.statSync(targetPath).mtime.toISOString();

    const renderedMcpServers = renderMcpServers(sot, targetName, resolveSecret);
    const after = Object.assign({}, before, { mcpServers: renderedMcpServers });

    const result = {
      target: targetName,
      path: targetPath,
      beforeMtime,
      identicalToLive: deepEqual(before, after),
      renderedServerNames: Object.keys(renderedMcpServers),
      addedServerNames: Object.keys(renderedMcpServers).filter(
        (n) => !Object.prototype.hasOwnProperty.call(before.mcpServers || {}, n)
      ),
      otherTopLevelKeysPreserved: Object.keys(before)
        .filter((k) => k !== 'mcpServers')
        .every((k) => deepEqual(before[k], after[k])),
      redactedRendered: redactMcpServers(renderedMcpServers),
      applied: false,
    };

    if (apply) {
      const backupPath = backupFile(targetPath);
      fs.writeFileSync(targetPath, JSON.stringify(after, null, 2) + '\n', 'utf8');
      result.applied = true;
      result.backupPath = backupPath;
      result.afterMtime = fs.statSync(targetPath).mtime.toISOString();
    }

    results.push(result);
  }

  console.log(JSON.stringify(results, null, 2));
}

main();
