import { toPublicCatalog, type PublicCatalog } from './publish.ts';

/**
 * Names and internal notes that must not appear in the public catalog.
 * This module is used by the publish script and tests. The site bundle does not import it.
 */
const PRIVATE_PHRASES = [
  'Eddie Koiki Mabo',
  'Gail Mabo',
  'Benny Mabo',
  'Eddie Mabo',
  'Mawalan',
  'Milpirrum',
  'Koiki',
  'Mabo',
  'Kuniya',
  'Liru',
  'RECOMMEND',
  'Check with',
  'ICIP',
  'Minyipuru',
  'Kungkarangkalpa',
  'Seven Sisters',
  'Budj Bim',
  'Bunjil',
];

export function publishCatalog(content: unknown, sources: unknown): PublicCatalog {
  return redactPublicCatalog(toPublicCatalog(content, sources));
}

export function redactPublicCatalog(catalog: PublicCatalog): PublicCatalog {
  const next = structuredClone(catalog);
  next.sources.forEach(adjustSource);
  next.content.knowledge.forEach(adjustKnowledge);
  next.content.groups.forEach(adjustGroup);
  next.content.people.forEach(adjustPerson);
  next.content.stories.forEach(adjustStory);
  next.content.timeline.forEach(adjustTimeline);
  next.content.places.forEach(adjustPlace);
  next.content.further_reading.forEach(adjustReading);
  ensureUluruHome(next);
  const redacted = walkStrings(next);
  const cited = citedSourceIds(redacted);
  redacted.sources = redacted.sources.filter((source) => cited.has(source.id));
  return redacted;
}

function adjustSource(source: PublicCatalog['sources'][number]): void {
  if (source.id === 'agsa-mabo') source.title = 'Tarnanthi 2021';
  if (source.id === 'sbs-mabo') {
    source.title = 'Taught his daughter about the stars';
    source.quality = 'Indigenous broadcaster';
  }
  if (source.id === 'nma-songlines-mr') source.title = 'National Museum of Australia media release (2020)';
  if (source.id === 'uluru-kuniya') source.title = "Custodians' source";
  if (source.id === 'gmtoac-budj') {
    source.author_org = 'Gunditj Mirring Traditional Owners Aboriginal Corporation';
    source.title = "Custodians' source";
  }
}

function ensureUluruHome(catalog: PublicCatalog): void {
  if (catalog.sources.some((source) => source.id === 'uluru-home')) return;
  catalog.sources.push({
    id: 'uluru-home',
    title: "Custodians' source",
    author_org: 'Parks Australia / Anangu Traditional Owners',
    url: 'https://uluru.gov.au',
    date_accessed: '2026-10-22',
    quality: 'Official park site',
  });
}

function citedSourceIds(catalog: PublicCatalog): Set<string> {
  const ids = new Set<string>();
  const lists = [
    catalog.content.knowledge,
    catalog.content.groups,
    catalog.content.places,
    catalog.content.stories,
    catalog.content.people,
    catalog.content.timeline,
    catalog.content.further_reading,
  ];
  lists.forEach((entries) => {
    entries.forEach((entry) => entry.sources.forEach((id) => ids.add(id)));
  });
  return ids;
}

function adjustKnowledge(entry: PublicCatalog['content']['knowledge'][number]): void {
  if (entry.id === 'k38') {
    entry.text =
      'A National Museum songlines exhibition was curated with senior custodians of Martu country and the APY and Ngaanyatjarra lands; it showed sections of five Western and Central Desert songlines across 500,000 km2.';
  }
}

function adjustGroup(group: PublicCatalog['content']['groups'][number]): void {
  if (group.id === 'g2') {
    group.text = 'Gunditjmara - Traditional Owners in south-western Victoria; represented by Gunditj Mirring Traditional Owners Aboriginal Corporation.';
    group.sources = ['gmtoac-budj', 'austlang-s20'];
  }
  if (group.id === 'g22') group.text = 'Martu (Western Desert, WA): custodians of a Western Desert songline.';
  if (group.id === 'g23') group.text = 'Ngaanyatjarra (Western Desert): songline custodians.';
}

function adjustPlace(place: PublicCatalog['content']['places'][number]): void {
  if (place.id === 'p2') {
    place.text = 'Gunditjmara country, see the custodians\' source';
    place.sources = ['gmtoac-budj'];
  }
  if (place.id === 'p6') {
    place.text = 'Gariwerd country, see the custodians\' source';
    place.sources = ['bom-gariwerd'];
  }
}

function adjustReading(entry: PublicCatalog['content']['further_reading'][number]): void {
  if (entry.id === 'fr5') {
    entry.text = 'Gunditjmara country, see the custodians\' source';
    entry.sources = ['gmtoac-budj'];
  }
}

function adjustTimeline(entry: PublicCatalog['content']['timeline'][number]): void {
  if (entry.id === 'tl14') {
    entry.text = 'Gunditjmara country, see the custodians\' source';
    entry.sources = ['gmtoac-budj'];
  }
  if (entry.id === 'tl15') entry.text = '2020 - NMA media release on a songlines touring exhibition.';
}

function adjustPerson(person: PublicCatalog['content']['people'][number]): void {
  if (person.id === 'pp1') {
    person.text = 'Piadram clan, Mer - artist and knowledge holder who shares the Tagai story.';
  }
  if (person.id === 'pp2') {
    person.text = 'Teacher of Tagai - taught Tagai to his daughter; a star was named for him in 2015 (per SBS).';
  }
  if (person.id === 'pp8') {
    person.text = 'Kumpaya Girgirba (Martu) - senior custodian involved in curating a National Museum songlines exhibition.';
  }
}

function adjustStory(story: PublicCatalog['content']['stories'][number]): void {
  if (story.id === 's3') story.nation = 'Torres Strait Islanders (Piadram clan, Mer)';
  if (story.id === 's6' && story.public_summary) {
    story.public_summary = story.public_summary.replace(' (Seven Sisters Dreaming, Pleiades)', ' (Pleiades)');
  }
  if (story.publish_status !== 'link-only') return;
  story.public_summary = null;
  delete story.deceased_note;
  delete story.sensitivity;
}

function walkStrings<T>(value: T): T {
  if (typeof value === 'string') return redactString(value) as T;
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      value[index] = walkStrings(item);
    });
    return value;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    Object.keys(record).forEach((key) => {
      record[key] = walkStrings(record[key]);
    });
  }
  return value;
}

function redactString(value: string): string {
  let next = value;
  PRIVATE_PHRASES.forEach((phrase) => {
    next = next.split(phrase).join('');
  });
  if (next === value) return value;
  return next
    .replace(/\(\s*as told by\s*,?\s*/gi, '(')
    .replace(/\(\s*\)/g, '')
    .replace(/\s+,/g, ',')
    .replace(/,\s*,/g, ',')
    .replace(/:\s*$/g, '')
    .replace(/;\s*quotes\s*$/gi, '')
    .replace(/^\s*[,;:\-]+\s*/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
