#!/usr/bin/env node
/**
 * Register (or reuse) the gami-web Firebase web app and print SDK config.
 *
 * Usage:
 *   node scripts/setup-firebase-web-app.mjs --project <PROJECT_ID>
 *   node scripts/setup-firebase-web-app.mjs --project-number 869899204398
 */

import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
function flag(name) {
  const i = args.indexOf(name);
  return i === -1 ? null : args[i + 1] ?? null;
}

const projectNumber = flag('--project-number') || '869899204398';
let projectId = flag('--project');
const nick = flag('--nick') || 'gami-web';

function run(cmd, cmdArgs, opts = {}) {
  return execFileSync(cmd, cmdArgs, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...opts,
  });
}

function firebase(argsList) {
  return run('npx', ['-y', 'firebase-tools@latest', ...argsList]);
}

if (!projectId) {
  const listJson = firebase(['projects:list', '--json']);
  const parsed = JSON.parse(listJson);
  const projects = parsed?.result ?? parsed ?? [];
  const match = (Array.isArray(projects) ? projects : []).find(
    (p) => String(p.projectNumber) === String(projectNumber) || p.projectId === projectNumber,
  );
  if (!match) {
    console.error(
      `Could not find Firebase project with number ${projectNumber}. Pass --project <PROJECT_ID>.`,
    );
    console.error('Run: npx -y firebase-tools@latest login && npx -y firebase-tools@latest projects:list');
    process.exit(1);
  }
  projectId = match.projectId;
}

console.log(`Using project ${projectId} (number ${projectNumber})`);
firebase(['use', projectId]);

let appId = null;
try {
  const appsJson = firebase(['apps:list', 'WEB', '--project', projectId, '--json']);
  const appsParsed = JSON.parse(appsJson);
  const apps = appsParsed?.result ?? [];
  const existing = apps.find((a) => a.displayName === nick) || apps[0];
  if (existing) {
    appId = existing.appId;
    console.log(`Reusing web app ${existing.displayName || 'web'} (${appId})`);
  }
} catch (error) {
  console.warn('Could not list apps:', error instanceof Error ? error.message : error);
}

if (!appId) {
  const created = firebase(['apps:create', 'web', nick, '--project', projectId, '--json']);
  const createdParsed = JSON.parse(created);
  appId = createdParsed?.result?.appId || createdParsed?.appId;
  if (!appId) {
    console.error('Failed to create web app. Raw output:');
    console.error(created);
    process.exit(1);
  }
  console.log(`Created web app ${nick} (${appId})`);
}

const sdk = firebase(['apps:sdkconfig', 'WEB', appId, '--project', projectId]);
console.log('\n--- SDK config ---\n');
console.log(sdk);

const match = sdk.match(/apiKey:\s*"([^"]+)"[\s\S]*?authDomain:\s*"([^"]+)"[\s\S]*?projectId:\s*"([^"]+)"[\s\S]*?storageBucket:\s*"([^"]+)"[\s\S]*?messagingSenderId:\s*"([^"]+)"[\s\S]*?appId:\s*"([^"]+)"/);
if (match) {
  console.log('\n--- gami-web/.env snippet ---\n');
  console.log(`VITE_FIREBASE_API_KEY=${match[1]}`);
  console.log(`VITE_FIREBASE_AUTH_DOMAIN=${match[2]}`);
  console.log(`VITE_FIREBASE_PROJECT_ID=${match[3]}`);
  console.log(`VITE_FIREBASE_STORAGE_BUCKET=${match[4]}`);
  console.log(`VITE_FIREBASE_MESSAGING_SENDER_ID=${match[5]}`);
  console.log(`VITE_FIREBASE_APP_ID=${match[6]}`);
}
