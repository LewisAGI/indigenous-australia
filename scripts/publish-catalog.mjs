import { readFileSync, writeFileSync } from 'node:fs';
import { publishCatalog } from '../src/data/redact-public.ts';

const content = JSON.parse(readFileSync(new URL('../data/content.json', import.meta.url), 'utf8'));
const sources = JSON.parse(readFileSync(new URL('../data/sources.json', import.meta.url), 'utf8'));
const catalog = publishCatalog(content, sources);
const target = new URL('../public/catalog.json', import.meta.url);
writeFileSync(target, `${JSON.stringify(catalog, null, 2)}\n`);
const stories = catalog.content.stories.length;
const groups = catalog.content.groups.length;
console.log(`wrote public/catalog.json (${groups} nations, ${stories} stories, ${catalog.sources.length} sources)`);
