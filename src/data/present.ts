import type { Feature, FeatureCollection, Point } from 'geojson';
import { isPublishedStory } from './publish.ts';
import type {
  BadgeKind,
  ContentPack,
  EraStatus,
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

export function groupsForPlace(place: Place, groups: Group[]): Group[] {
  if (!place.nation) return [];
  const hay = place.nation.toLowerCase();
  return groups.filter((group) => {
    const lead = group.name.split('(')[0].trim().toLowerCase();
    return lead.length >= 4 && hay.includes(lead);
  });
}

export function storiesForNation(group: Group, stories: Story[]): Story[] {
  const lead = group.name.split('(')[0].trim().toLowerCase();
  return stories.filter(isPublishedStory).filter((story) => {
    const hay = `${story.nation} ${story.place}`.toLowerCase();
    if (lead.length >= 4 && hay.includes(lead)) return true;
    if (group.torres_strait && /\bmer\b/i.test(story.nation) && /\bmer\b/i.test(group.text)) return true;
    return false;
  });
}

export function storyMatchesPlace(place: Place, story: Story): boolean {
  if (!isPublishedStory(story)) return false;
  if (isStoryFreePlace(place)) return false;
  if (/kata\s*tjuta|wollumbin/i.test(story.place)) return false;
  const where = story.place.toLowerCase();
  const title = shortTitle(place.text).toLowerCase();
  if (title.startsWith('uluru')) return /\buluru\b/.test(where);
  const name = title.split('(')[0].split('/')[0].replace(/\s+cultural landscape.*/i, '').trim();
  if (name.length < 4) return false;
  return where.includes(name);
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
