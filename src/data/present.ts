import type { Feature, FeatureCollection, Point } from 'geojson';
import { isPublishedStory } from './publish.ts';
import type {
  BadgeKind,
  ContentPack,
  EraStatus,
  FurtherReading,
  Group,
  KnowledgeEntry,
  LifeFlag,
  Person,
  Place,
  Story,
  TimelineEntry,
} from './schema.ts';
import { badgeKind } from './schema.ts';

export interface MapPoint {
  id: string;
  lat: number;
  lon: number;
  label: string;
  status: EraStatus;
  placeId?: string;
  groupId?: string;
  uncertainty: string;
}

export type LifeStatus = 'living' | 'deceased' | 'unconfirmed';

export type EntryKind = 'group' | 'place' | 'story' | 'person' | 'timeline' | 'knowledge' | 'reading';

export interface SearchHit {
  kind: EntryKind;
  id: string;
  title: string;
}

export interface GlossaryTerm {
  term: string;
  id: string;
}

export interface NationSnapshot {
  id: string;
  name: string;
  status: EraStatus;
  torres: boolean;
  languages: string[];
  austlang: string[];
  places: string[];
  stories: string[];
}

const NAME_STOP = new Set([
  'torres',
  'strait',
  'peoples',
  'people',
  'island',
  'islands',
  'nation',
  'nations',
  'western',
  'eastern',
  'central',
  'aboriginal',
  'australian',
  'indigenous',
  'protected',
  'area',
  'national',
  'park',
  'cultural',
  'landscape',
  'world',
  'heritage',
  'point',
  'reserve',
  'scenic',
  'river',
  'mount',
  'cape',
  'gulf',
]);

/** Terms whose wording is the pack entry itself. Withheld entries are omitted by the page. */
export const GLOSSARY: GlossaryTerm[] = [
  { term: 'Tjukurpa', id: 'k4' },
  { term: 'AustLang', id: 'k6' },
  { term: 'Zenadth Kes', id: 'k9' },
  { term: 'Torres Strait Creole', id: 'k10' },
  { term: 'palawa kani', id: 'k26' },
  { term: 'Songlines', id: 'k38' },
  { term: 'Yirrkala Bark Petitions', id: 'k37' },
  { term: 'Papunya Tula', id: 'k40' },
];

export function splitLabel(label: string): { kind: BadgeKind; note?: string } {
  const kind = badgeKind(label);
  const note = label.replace(/^(evidence|inference|abstract-only|abstract only)\b\s*/i, '').trim();
  return note ? { kind, note } : { kind };
}

export function splitInference(value: string): { text: string; inference?: string } {
  const match = value.match(/^(.*?)\s*\((inference:\s*.*)\)\s*$/i);
  if (!match) return { text: value };
  return { text: match[1], inference: match[2] };
}

export function isExampleData(entry: { example?: boolean; label?: string; text?: string; title?: string }): boolean {
  if (entry.example) return true;
  return /\bplaceholder\b|\bexample data\b/i.test(`${entry.label ?? ''} ${entry.text ?? ''} ${entry.title ?? ''}`);
}

export function lifeStatus(flag: LifeFlag | undefined): LifeStatus {
  if (flag === false) return 'living';
  if (flag === true) return 'deceased';
  return 'unconfirmed';
}

/** Missing and "unknown" life statuses take the warning. A recorded living person does not. */
export function needsDeceasedWarning(flag: LifeFlag | undefined): boolean {
  return lifeStatus(flag) !== 'living';
}

export function shortTitle(text: string): string {
  let head = text.split(':')[0].trim();
  head = head.split(',')[0].trim();
  head = head.split(';')[0].trim();
  head = head.replace(/\s+inscribed[\s\S]*$/i, '').trim();
  return head;
}

/** Kata Tjuta and Wollumbin stay places. No story is attached, even by nation. */
export function isStoryFreePlace(place: Place): boolean {
  if (place.no_stories) return true;
  return /^(kata\s*tjuta|wollumbin)\b/i.test(shortTitle(place.text));
}

const NO_PHOTO_TEXT =
  'No photographs. Traditional Owners ask visitors not to climb the rocks or photograph rock art at Anthwerrke (Emily Gap).';

export function noPhotographyNote(entry: {
  id?: string;
  text?: string;
  title?: string;
  place?: string;
  no_photography?: boolean;
}): string | null {
  const blob = `${entry.text ?? ''} ${entry.title ?? ''} ${entry.place ?? ''}`;
  const hit = entry.no_photography || entry.id === 'k34' || entry.id === 'p22' || entry.id === 's7' || /emily gap|anthwerrke/i.test(blob);
  return hit ? NO_PHOTO_TEXT : null;
}

export function forbidsDesigns(entry: {
  id?: string;
  text?: string;
  title?: string;
  place?: string;
  sensitivity?: string;
  no_designs?: boolean;
}): boolean {
  if (entry.no_designs) return true;
  if (entry.id === 's8' || entry.id === 'k35' || entry.id === 'k36' || entry.id === 'k40' || entry.id === 'p23') return true;
  const blob = `${entry.text ?? ''} ${entry.title ?? ''} ${entry.place ?? ''}`;
  if (/djang['’]kawu/i.test(blob)) return true;
  return /do not (copy|reproduce)/i.test(entry.sensitivity ?? '');
}

export function storyBody(story: Story): string | null {
  if (!isPublishedStory(story)) return null;
  if (story.publish_status === 'link-only') return null;
  return story.public_summary;
}

export function filterGroups(groups: Group[], era: EraStatus, torresOnly: boolean): Group[] {
  return groups.filter((group) => group.status === era && (!torresOnly || group.torres_strait === true));
}

export function filterPlaces(places: Place[], groups: Group[], torresOnly: boolean): Place[] {
  if (!torresOnly) return places;
  return places.filter((place) => mentionsTorres(`${place.text} ${place.nation ?? ''}`) || groupsForPlace(place, groups.filter((group) => group.torres_strait)).length > 0);
}

export function filterStories(stories: Story[], groups: Group[], torresOnly: boolean): Story[] {
  const published = stories.filter(isPublishedStory);
  if (!torresOnly) return published;
  const torres = groups.filter((group) => group.torres_strait);
  return published.filter((story) => torres.some((group) => storiesForNation(group, [story]).length > 0));
}

export function filterPeople(people: Person[], torresOnly: boolean): Person[] {
  if (!torresOnly) return people;
  return people.filter((person) => mentionsTorres(person.text));
}

export function filterKnowledge(entries: KnowledgeEntry[], torresOnly: boolean): KnowledgeEntry[] {
  if (!torresOnly) return entries;
  return entries.filter((entry) => mentionsTorres(`${entry.text} ${entry.nation ?? ''}`));
}

export function filterTimeline(entries: TimelineEntry[], torresOnly: boolean): TimelineEntry[] {
  if (!torresOnly) return entries;
  return entries.filter((entry) => mentionsTorres(entry.text));
}

export function filterReading(entries: FurtherReading[], torresOnly: boolean): FurtherReading[] {
  if (!torresOnly) return entries;
  return entries.filter((entry) => mentionsTorres(entry.text));
}

export function groupsForPlace(place: Place, groups: Group[]): Group[] {
  const hay = `${place.nation ?? ''} ${shortTitle(place.text)}`.toLowerCase();
  return groups.filter((group) => nameTokens(group.name).some((token) => hay.includes(token)));
}

export function storiesForNation(group: Group, stories: Story[]): Story[] {
  const tokens = nameTokens(group.name);
  return stories.filter(isPublishedStory).filter((story) => {
    const hay = `${story.nation} ${story.place} ${story.title}`.toLowerCase();
    if (tokens.some((token) => hay.includes(token))) return true;
    if (group.torres_strait && /torres strait|zenadth|tagai/i.test(hay)) return true;
    return false;
  });
}

export function storyMatchesPlace(place: Place, story: Story): boolean {
  if (!isPublishedStory(story)) return false;
  if (isStoryFreePlace(place)) return false;
  if (/kata\s*tjuta|wollumbin/i.test(`${story.place} ${story.title}`)) return false;
  const where = `${story.place} ${story.title}`.toLowerCase();
  const title = shortTitle(place.text);
  if (/^uluru\b/i.test(title)) return /\buluru\b/i.test(where);
  if (mentionsTorres(`${place.text} ${place.nation ?? ''}`) && /torres strait|zenadth|tagai/i.test(where)) return true;
  return nameTokens(title).some((token) => where.includes(token));
}

export function storiesForPlace(place: Place, stories: Story[]): Story[] {
  if (isStoryFreePlace(place)) return [];
  return stories.filter((story) => storyMatchesPlace(place, story));
}

export function placeForStory(story: Story, places: Place[]): Place | undefined {
  return places.find((place) => storyMatchesPlace(place, story));
}

export function placesForNation(group: Group, places: Place[]): Place[] {
  return places.filter((place) => groupsForPlace(place, [group]).some((item) => item.id === group.id));
}

export function peopleForBlob(blob: string, people: Person[]): Person[] {
  const hay = blob.toLowerCase();
  return people.filter((person) => {
    const name = personName(person).toLowerCase();
    return name.length >= 4 && hay.includes(name);
  });
}

export function knowledgeForBlob(blob: string, entries: KnowledgeEntry[]): KnowledgeEntry[] {
  return overlap(blob, entries.map((entry) => ({ id: entry.id, text: `${entry.text} ${entry.nation ?? ''}` }))).flatMap((hit) => {
    const entry = entries.find((item) => item.id === hit);
    return entry ? [entry] : [];
  });
}

export function timelineForBlob(blob: string, entries: TimelineEntry[]): TimelineEntry[] {
  return overlap(blob, entries.map((entry) => ({ id: entry.id, text: entry.text }))).flatMap((hit) => {
    const entry = entries.find((item) => item.id === hit);
    return entry ? [entry] : [];
  });
}

export function pointUncertainty(format?: string): string {
  if (format) return `Sourced coordinate ${format}. Site centroid, not a boundary of Country.`;
  return 'Sourced point, not a boundary of Country.';
}

/** Points are copied from sourced coordinates only. Names are never geocoded. */
export function buildMarkers(content: ContentPack): MapPoint[] {
  const clusters = new Map<string, MapPoint>();
  content.places.forEach((place) => {
    if (!place.coords) return;
    const nations = groupsForPlace(place, content.groups);
    const key = keyOf(place.coords.lat, place.coords.lon);
    const point = clusters.get(key) ?? blankPoint(place.coords.lat, place.coords.lon, nations[0]?.status ?? 'present');
    point.placeId = place.id;
    point.id = place.id;
    point.uncertainty = pointUncertainty(place.coords.source_format);
    if (nations[0]) point.groupId = nations[0].id;
    point.label = markerLabel(nations[0]?.name, shortTitle(place.text));
    point.status = nations[0]?.status ?? 'present';
    clusters.set(key, point);
  });
  content.groups.forEach((group) => {
    if (!group.approximate_location) return;
    const loc = group.approximate_location;
    const key = keyOf(loc.lat, loc.lon);
    const existing = clusters.get(key);
    if (existing) {
      existing.groupId = existing.groupId ?? group.id;
      if (!existing.label.includes(group.name)) existing.label = markerLabel(group.name, existing.label);
      return;
    }
    const point = blankPoint(loc.lat, loc.lon, group.status);
    point.id = group.id;
    point.groupId = group.id;
    point.label = group.name;
    point.uncertainty = pointUncertainty(loc.source_format);
    clusters.set(key, point);
  });
  return [...clusters.values()];
}

export function markerFeatures(points: MapPoint[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: points.map((point) => {
      const feature: Feature<Point> = {
        type: 'Feature',
        properties: { id: point.id, role: 'point' },
        geometry: { type: 'Point', coordinates: [point.lon, point.lat] },
      };
      return feature;
    }),
  };
}

export function knowledgeSpotlight(entries: KnowledgeEntry[]): KnowledgeEntry | undefined {
  return entries.find((entry) => entry.id === 'k3');
}

export function sortTimeline(entries: TimelineEntry[]): TimelineEntry[] {
  return [...entries].sort((a, b) => a.year - b.year || a.id.localeCompare(b.id));
}

export function personHeading(person: Person): string {
  return person.text.split(' - ')[0].trim();
}

export function personName(person: Person): string {
  return personHeading(person).split(',')[0].trim();
}

export function nationSnapshot(group: Group, content: ContentPack): NationSnapshot {
  return {
    id: group.id,
    name: group.name,
    status: group.status,
    torres: group.torres_strait === true,
    languages: group.languages ?? [],
    austlang: group.austlang ?? [],
    places: placesForNation(group, content.places).map((place) => shortTitle(place.text)),
    stories: storiesForNation(group, content.stories).map((story) => story.title),
  };
}

export function searchCatalog(content: ContentPack, query: string): SearchHit[] {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return [];
  const hits: SearchHit[] = [];
  const push = (kind: EntryKind, id: string, title: string, hay: string) => {
    if (hay.toLowerCase().includes(needle)) hits.push({ kind, id, title });
  };
  content.groups.forEach((group) => push('group', group.id, group.name, `${group.name} ${group.text} ${(group.austlang ?? []).join(' ')} ${(group.languages ?? []).join(' ')}`));
  content.places.forEach((place) => push('place', place.id, shortTitle(place.text), `${place.text} ${place.nation ?? ''}`));
  content.stories.forEach((story) => {
    if (!isPublishedStory(story)) return;
    push('story', story.id, story.title, `${story.title} ${story.nation} ${story.place} ${story.public_summary ?? ''}`);
  });
  content.people.forEach((person) => push('person', person.id, personName(person), person.text));
  content.timeline.forEach((entry) => push('timeline', entry.id, String(entry.year), `${entry.year} ${entry.text}`));
  content.knowledge.forEach((entry) => push('knowledge', entry.id, shortTitle(entry.text), `${entry.text} ${entry.nation ?? ''}`));
  content.further_reading.forEach((entry) => push('reading', entry.id, shortTitle(entry.text), entry.text));
  GLOSSARY.forEach((term) => {
    if (term.term.toLowerCase().includes(needle) && content.knowledge.some((entry) => entry.id === term.id)) {
      if (!hits.some((hit) => hit.id === term.id)) push('knowledge', term.id, term.term, term.term);
    }
  });
  return hits.slice(0, 24);
}

export function glossaryTerms(entries: KnowledgeEntry[]): GlossaryTerm[] {
  const ids = new Set(entries.map((entry) => entry.id));
  return GLOSSARY.filter((term) => ids.has(term.id));
}

function markerLabel(nation: string | undefined, place: string): string {
  if (nation && place && !place.includes(nation)) return `${nation} · ${place}`;
  return nation || place;
}

function blankPoint(lat: number, lon: number, status: EraStatus): MapPoint {
  return { id: '', lat, lon, label: '', status, uncertainty: pointUncertainty() };
}

function keyOf(lat: number, lon: number): string {
  return `${lat.toFixed(5)}:${lon.toFixed(5)}`;
}

function nameTokens(name: string): string[] {
  return name
    .split('(')[0]
    .split(/[/,&]|\band\b/i)
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length >= 4 && !NAME_STOP.has(part));
}

function mentionsTorres(value: string): boolean {
  return /torres strait|zenadth|tagai|meriam|\berub\b|\bmasig\b/i.test(value);
}

const LINK_STOP = new Set([
  ...NAME_STOP,
  'language',
  'languages',
  'including',
  'traditional',
  'country',
  'between',
  'through',
  'community',
  'communities',
  'seasonal',
  'calendar',
  'seasons',
  'published',
  'visitors',
  'ancestral',
  'knowledge',
  'speaking',
  'spoken',
  'region',
  'sources',
  'summary',
  'credit',
  'shared',
  'owners',
  'owner',
  'around',
  'within',
  'during',
  'before',
  'after',
  'about',
  'other',
  'others',
  'first',
  'their',
  'there',
  'which',
  'where',
  'these',
  'those',
]);

function overlap(seed: string, entries: { id: string; text: string }[]): string[] {
  const tokens = [
    ...new Set(
      seed
        .toLowerCase()
        .split(/[^a-z0-9']+/i)
        .filter((token) => token.length >= 6 && !LINK_STOP.has(token)),
    ),
  ];
  if (tokens.length === 0) return [];
  return entries
    .filter((entry) => tokens.some((token) => entry.text.toLowerCase().includes(token)))
    .slice(0, 6)
    .map((entry) => entry.id);
}
