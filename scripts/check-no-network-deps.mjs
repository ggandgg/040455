#!/usr/bin/env node
// Privacy guard: fail CI if package.json includes any known telemetry,
// analytics, crash-reporting, ads, or remote-config SDK. See SPEC.md §6.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const FORBIDDEN = [
  '@sentry/', '@bugsnag/', '@amplitude/', '@segment/',
  'mixpanel', 'posthog', 'heap-react-native',
  '@react-native-firebase/analytics',
  '@react-native-firebase/crashlytics',
  '@react-native-firebase/remote-config',
  '@react-native-firebase/perf',
  'firebase',
  'react-native-google-analytics-bridge',
  'react-native-google-mobile-ads',
  'react-native-facebook-ads',
  'react-native-onesignal',
  'react-native-appsflyer',
  'react-native-adjust',
  'react-native-branch',
  'react-native-iterable',
];

function check(filePath) {
  const pkg = JSON.parse(readFileSync(filePath, 'utf8'));
  const allDeps = {
    ...(pkg.dependencies ?? {}),
    ...(pkg.devDependencies ?? {}),
    ...(pkg.peerDependencies ?? {}),
    ...(pkg.optionalDependencies ?? {}),
  };
  const hits = [];
  for (const name of Object.keys(allDeps)) {
    for (const banned of FORBIDDEN) {
      if (name.includes(banned)) {
        hits.push({ name, banned });
      }
    }
  }
  return hits;
}

const root = resolve(process.cwd(), 'package.json');
const hits = check(root);
if (hits.length > 0) {
  console.error('\n[privacy-guard] Forbidden network-using packages detected:');
  for (const h of hits) {
    console.error(`  - ${h.name}  (matches "${h.banned}")`);
  }
  console.error(
    '\nThis app must remain zero-network per SPEC.md §6.',
    '\nRemove the dependency, or update SPEC.md and this allowlist',
    'after re-confirming with the owner.\n',
  );
  process.exit(1);
}

console.log('[privacy-guard] OK: no telemetry/analytics/crash/ads packages in deps.');
