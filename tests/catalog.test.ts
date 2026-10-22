import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { isPublicProtocolLine } from '../src/data/protocol.ts';
import { hasCheckedSource, isPublishedStory, isUncheckedQuality, parsePublicCatalog, scrubText } from '../src/data/publish.ts';
import { publishCatalog } from '../src/data/redact-public.ts';
import {
  buildMarkers,
  filterGroups,
  forbidsDesigns,
  glossaryTerms,
  isExampleData,
  isStoryFreePlace,
  lifeStatus,
  nationSnapshot,
  needsDeceasedWarning,
  noPhotographyNote,
  searchCatalog,
  storiesForPlace,
} from '../src/data/present.ts';
import { parseContent, parseSources } from '../src/data/schema.ts';
import type { ContentPack, Source, Story } from '../src/data/schema.ts';

const content = JSON.parse(readFileSync(new URL('../data/content.json', import.meta.url), 'utf8')) as ContentPack;
const sources = JSON.parse(readFileSync(new URL('../data/sources.json', import.meta.url), 'utf8')) as Source[];
const catalog = publishCatalog(content, sources);
const banned = [/woma python/i, /poisonous brown snake/i, /pursuit and escape/i, /no deceased persons are named/i];

function collectSensitivity(value: unknown): string[] {
  const lines: string[] = [];
  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    const record = node as Record<string, unknown>;
    if (typeof record.sensitivity === 'string') lines.push(...record.sensitivity.split('\n'));
    Object.values(record).forEach(visit);
  };
  visit(value);
  return lines;
}

function story(id: string): Story {
  const found = catalog.content.stories.find((item) => item.id === id);
  if (!found) throw new Error(`missing ${id}`);
  return found;
}

describe('pack counts and the public catalog', () => {
  it('keeps the v3 pack counts and version', () => {
    const total = (['knowledge', 'groups', 'stories', 'places', 'people', 'timeline', 'further_reading'] as const).reduce(
      (sum, key) => sum + content[key].length,
      0,
    );
    expect(total).toBe(120);
    expect(sources).toHaveLength(75);
    expect(content.meta.version).toBe(1);
    expect(content.meta.deceased_warning_note).toMatch(/no deceased persons are named/i);
  });

  it('withholds the deceased-persons note, link-only retellings, and unchecked-only entries', () => {
    expect(catalog.content.meta).not.toHaveProperty('deceased_warning_note');
    const blob = JSON.stringify(catalog);
    banned.forEach((pattern) => expect(blob).not.toMatch(pattern));
    expect(story('s1').public_summary).toBeNull();
    expect(story('s9').public_summary).toBeNull();
    expect(story('s1').title).toBe("Anangu Tjukurpa: see the custodians' source");
    expect(story('s9').title).toBe("A desert songline: see the custodians' source");
    expect(story('s1').sources).toEqual(['uluru-home']);
    expect(catalog.sources.find((source) => source.id === 'uluru-home')?.url).toBe('https://uluru.gov.au');
    expect(story('s1').publish_status).toBe('link-only');
    expect(story('s2').title).toBe("Gunditjmara: see the custodians' source");
    expect(story('s2').public_summary).toBeNull();
    expect(story('s2').sources).toEqual(['gmtoac-budj']);
    expect(catalog.content.stories.some((item) => item.id === 's4')).toBe(false);
    expect(catalog.content.places.some((item) => item.id === 'p6')).toBe(false);
    expect(catalog.content.stories.every((item) => !item.sources.includes('bom-gariwerd'))).toBe(true);
    expect(blob).not.toContain('verified: Parks Victoria page read');
    expect(blob).toContain('Gail Mabo');
    expect(catalog.content.people.find((person) => person.id === 'pp1')?.text).toContain('Gail Mabo');
    expect(story('s3').nation).toContain('as told by Gail Mabo');
    expect(story('s3').sensitivity).toBe('Publicly shared by custodians');
    expect(story('s5').sensitivity).toBe('Publicly shared by custodians');
    expect(story('s8').sensitivity).toContain('Published with the Marika family for education');
    expect(blob).not.toContain('with permission');
    expect(blob).not.toContain('deceased_note');
    ['Kuniya', 'Liru', 'Seven Sisters', 'Minyipuru', 'Kungkarangkalpa', 'RECOMMEND', 'Check with', 'ICIP', 'Mawalan', 'Milpirrum', 'Koiki', 'Eddie Mabo', 'Benny Mabo', 'Budj Bim', 'Bunjil'].forEach(
      (phrase) => expect(blob, phrase).not.toContain(phrase),
    );
    const protocols = collectSensitivity(catalog);
    protocols.forEach((line) => expect(isPublicProtocolLine(line)).toBe(true));
    expect(story('s5').publish_status).toBe('summary-with-credit');
    expect(story('s5').place).not.toMatch(/search-summary/i);
    expect(catalog.content.groups.map((group) => group.id)).not.toEqual(expect.arrayContaining(['g19', 'g20']));
    expect(catalog.content.knowledge.map((entry) => entry.id)).not.toEqual(expect.arrayContaining(['k25', 'k28', 'k32']));
    expect(catalog.content.groups).toHaveLength(23);
    expect(catalog.content.knowledge).toHaveLength(38);
    expect(catalog.content.stories).toHaveLength(8);
    expect(catalog.content.places).toHaveLength(19);
  });

  it('matches the catalog written for the build', () => {
    const written = JSON.parse(readFileSync(new URL('../public/catalog.json', import.meta.url), 'utf8'));
    expect(written).toEqual(catalog);
    expect(parsePublicCatalog(written)).toEqual(catalog);
  });

  it('places one sourced marker and keeps restricted places story-free', () => {
    const markers = buildMarkers(catalog.content);
    expect(markers).toHaveLength(1);
    expect(markers[0]).toMatchObject({ lat: -25.33333, lon: 131, placeId: 'p1' });
    const kata = catalog.content.places.find((place) => place.id === 'p3');
    const wollumbin = catalog.content.places.find((place) => place.id === 'p4');
    const emily = catalog.content.places.find((place) => place.id === 'p22');
    expect(kata && isStoryFreePlace(kata)).toBe(true);
    expect(wollumbin && isStoryFreePlace(wollumbin)).toBe(true);
    expect(kata && storiesForPlace(kata, catalog.content.stories)).toEqual([]);
    expect(wollumbin && storiesForPlace(wollumbin, catalog.content.stories)).toEqual([]);
    expect(emily && storiesForPlace(emily, catalog.content.stories).map((item) => item.id)).toEqual(['s7']);
    expect(noPhotographyNote(emily ?? {})).toMatch(/No photographs/);
    expect(noPhotographyNote(story('s7'))).toMatch(/No photographs/);
    expect(forbidsDesigns(story('s8'))).toBe(true);
  });

  it('treats missing life status as unconfirmed and a recorded living person as living', () => {
    const people = Object.fromEntries(catalog.content.people.map((person) => [person.id, person.deceased_persons]));
    expect(lifeStatus(people.pp1)).toBe('living');
    expect(needsDeceasedWarning(people.pp1)).toBe(false);
    expect(lifeStatus(people.pp2)).toBe('deceased');
    expect(lifeStatus(people.pp5)).toBe('unconfirmed');
    expect(lifeStatus(people.pp3)).toBe('unconfirmed');
    expect(needsDeceasedWarning(people.pp3)).toBe(true);
  });
});

describe('reading tools', () => {
  it('searches, compares, and builds the glossary from published entries', () => {
    const hits = searchCatalog(catalog.content, 'uluru');
    expect(hits.some((hit) => hit.id === 'p1')).toBe(true);
    expect(hits.some((hit) => hit.id === 'g19')).toBe(false);
    const terms = glossaryTerms(catalog.content.knowledge);
    expect(terms.map((term) => term.term)).toContain('Tjukurpa');
    expect(terms.some((term) => term.id === 'k25')).toBe(false);
    const anangu = catalog.content.groups.find((group) => group.id === 'g1');
    const gunditjmara = catalog.content.groups.find((group) => group.id === 'g2');
    expect(anangu && nationSnapshot(anangu, catalog.content).stories).toContain("Anangu Tjukurpa: see the custodians' source");
    expect(gunditjmara && nationSnapshot(gunditjmara, catalog.content).stories).toContain("Gunditjmara: see the custodians' source");
    expect(gunditjmara && nationSnapshot(gunditjmara, catalog.content).places.some((title) => /Gunditjmara country/.test(title))).toBe(true);
    expect(filterGroups(catalog.content.groups, 'historic', false)).toEqual([]);
    expect(filterGroups(catalog.content.groups, 'present', true).every((group) => group.torres_strait)).toBe(true);
  });

  it('labels placeholder rows and drops unchecked or restricted additions', () => {
    expect(isExampleData({ text: 'placeholder coastline' })).toBe(true);
    expect(isExampleData({ example: true, text: 'Noted' })).toBe(true);
    expect(isExampleData({ text: 'Anangu' })).toBe(false);
    expect(isUncheckedQuality('Peer-reviewed press; read via search summary')).toBe(true);
    expect(isUncheckedQuality('Authoritative; read via search result page extract')).toBe(true);
    expect(isUncheckedQuality('Authoritative language register; page read and code verified 2026-10-22')).toBe(false);
    expect(hasCheckedSource(['austlang-c14'], sources)).toBe(false);
    expect(scrubText('Darling Scarp (Derbarl Yerrigan link is search-summary only)')).toBe('Darling Scarp');

    const extraSources = [
      ...sources,
      { id: 'zz-ok', title: 'Checked', author_org: 'Test', url: 'https://example.com/ok', date_accessed: '2026-10-22', quality: 'Primary' },
      { id: 'zz-un', title: 'Unchecked', author_org: 'Test', url: 'https://example.com/un', date_accessed: '2026-10-22', quality: 'read via search summary' },
    ];
    const next = structuredClone(content);
    next.stories.push({
      id: 's-secret',
      title: 'Secret',
      nation: 'Test',
      place: 'Test',
      public_summary: 'Do not publish this retelling',
      sources: ['zz-ok'],
      label: 'evidence',
      publish_status: 'summary-with-credit',
      secret_sacred: true,
      deceased_persons: false,
    });
    next.stories.push({
      id: 's-pending',
      title: 'Pending',
      nation: 'Test',
      place: 'Test',
      public_summary: 'Still being checked',
      sources: ['zz-ok'],
      label: 'evidence',
      publish_status: 'summary-pending-review',
      secret_sacred: false,
      deceased_persons: false,
    });
    next.stories.push({
      id: 's-search',
      title: 'Search label',
      nation: 'Test',
      place: 'Test',
      public_summary: 'From a search summary',
      sources: ['zz-ok'],
      label: 'evidence (search-summary)',
      publish_status: 'summary-with-credit',
      secret_sacred: false,
      deceased_persons: false,
    });
    next.knowledge.push({
      id: 'k-un',
      text: 'Only an unchecked source',
      sources: ['zz-un'],
      label: 'evidence',
    });
    next.knowledge.push({
      id: 'k-restricted',
      text: 'A restricted story that must not be published',
      sources: ['zz-ok'],
      label: 'evidence',
      sensitivity: 'RESTRICTED - do not publish stories',
    });
    const published = publishCatalog(next, extraSources);
    const ids = [
      ...published.content.stories.map((item) => item.id),
      ...published.content.knowledge.map((item) => item.id),
    ];
    expect(ids).not.toEqual(expect.arrayContaining(['s-secret', 's-pending', 's-search', 'k-un', 'k-restricted']));
  });

  it('withholds a story that is still pending review', () => {
    const pending: Story = {
      id: 's-pending',
      title: 'Pending',
      nation: 'Test',
      place: 'Test place',
      public_summary: 'Still being checked',
      sources: ['zz-ok'],
      label: 'evidence',
      publish_status: 'summary-pending-review',
      secret_sacred: false,
      deceased_persons: false,
    };
    expect(isPublishedStory(pending)).toBe(false);
    const extraSources = [
      ...sources,
      { id: 'zz-ok', title: 'Checked', author_org: 'Test', url: 'https://example.com/ok', date_accessed: '2026-10-22', quality: 'Primary' },
    ];
    const next = structuredClone(content);
    next.stories.push(pending);
    const published = publishCatalog(next, extraSources);
    expect(published.content.stories.some((item) => item.id === 's-pending')).toBe(false);
    expect(published.content.stories.some((item) => item.publish_status === 'summary-pending-review')).toBe(false);
  });

  it('rejects geometry on an entry', () => {
    const parsedSources = parseSources(sources);
    const broken = structuredClone(content);
    (broken.knowledge[0] as ContentPack['knowledge'][number] & { geometry?: unknown }).geometry = { type: 'Polygon' };
    expect(() => parseContent(broken, parsedSources, 'source')).toThrow(/geometry/);
  });
});
