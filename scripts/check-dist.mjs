import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = 'dist';
const failures = [];
const banned = ['woma python', 'poisonous brown snake', 'pursuit and escape', 'no deceased persons are named'];
const forbiddenNames = new Set(['_worker.js', '_routes.json', 'functions']);

function fail(message) {
  failures.push(message);
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (forbiddenNames.has(entry)) fail(`Pages Function path: ${path}`);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walk(path);
      continue;
    }
    if (!/\.(html|js|css|json|txt|svg|webmanifest)$/i.test(entry)) continue;
    const text = readFileSync(path, 'utf8').toLowerCase();
    banned.forEach((phrase) => {
      if (text.includes(phrase)) fail(`${phrase} in ${path}`);
    });
  }
}

if (!existsSync(root)) fail('dist/ is missing');
else walk(root);

for (const name of ['index.html', 'catalog.json', '_headers']) {
  if (!existsSync(join(root, name))) fail(`missing dist/${name}`);
}

if (existsSync(join(root, '_headers'))) {
  const headers = readFileSync(join(root, '_headers'), 'utf8');
  ['Content-Security-Policy', 'nosniff', 'Referrer-Policy', "default-src 'self'", "script-src 'self'"].forEach((needle) => {
    if (!headers.includes(needle)) fail(`_headers missing ${needle}`);
  });
}

if (failures.length > 0) {
  failures.forEach((message) => console.error(message));
  process.exit(1);
}

console.log('dist check ok');
