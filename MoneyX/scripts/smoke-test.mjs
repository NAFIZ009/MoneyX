/**
 * Local smoke test: validates env vars and Firebase connectivity.
 * Run from MoneyX/: node scripts/smoke-test.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnv() {
  const candidates = [
    resolve(root, '.env'),
    resolve(root, '..', '.env'),
  ];

  const envPath = candidates.find((p) => existsSync(p));
  if (!envPath) {
    throw new Error('.env not found — place it in MoneyX/ or the repo root (see README)');
  }

  const env = {};
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    env[key.trim()] = rest.join('=').trim();
  }
  return env;
}

const required = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const env = loadEnv();
const missing = required.filter((key) => !env[key]);
if (missing.length) {
  console.error('❌ Missing env vars:', missing.join(', '));
  process.exit(1);
}
console.log('✅ All Firebase env vars present');

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});

const db = getFirestore(app);

try {
  // Lightweight connectivity check (may fail on permission rules — that's ok)
  await getDocs(query(collection(db, 'users'), limit(1)));
  console.log('✅ Firestore reachable');
} catch (err) {
  if (err.code === 'permission-denied') {
    console.log('✅ Firestore reachable (permission-denied on users — expected without auth)');
  } else {
    console.error('❌ Firestore error:', err.message);
    process.exit(1);
  }
}

console.log('✅ Smoke test passed');
