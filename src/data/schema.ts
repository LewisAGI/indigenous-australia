export type BadgeKind = 'evidence' | 'inference' | 'abstract-only';
export type EraStatus = 'present' | 'historic';
export type PublishStatus = 'link-only' | 'summary-with-credit' | 'summary-pending-review';
export type LifeFlag = boolean | string;

export interface Coords {
  lat: number;
  lon: number;
  source_format?: string;
}

export interface Source {
  id: string;
  title: string;
  author_org: string;
  url: string;
  date_accessed: string;
  quality: string;
}

export interface Meta {
  pack: string;
  version: number;
  created: string;
  map_caveat: string;
  deceased_persons_warning_default: string;
  /** Source pack only. Withheld from the site: later entries do name deceased people. */
  deceased_warning_note?: string;
}

interface EntryNotes {
  sensitivity?: string;
  uncertainty?: string;
  debate?: string;
  example?: boolean;
}

export interface KnowledgeEntry extends EntryNotes {
  id: string;
  text: string;
  sources: string[];
  label: string;
  nation?: string;
}

export interface Group extends EntryNotes {
  id: string;
  text: string;
  sources: string[];
  label: string;
  name: string;
  languages?: string[];
  status: EraStatus;
  approximate_location: Coords | null;
  boundary_caveat: string;
  austlang?: string[];
  torres_strait?: boolean;
}

export interface Story extends EntryNotes {
  id: string;
  title: string;
  nation: string;
  place: string;
  public_summary: string | null;
  sources: string[];
  label: string;
  publish_status: PublishStatus;
  secret_sacred: boolean;
  deceased_persons: LifeFlag;
  deceased_note?: string;
  exclude_from_build?: boolean;
  no_designs?: boolean;
}

export interface Place extends EntryNotes {
  id: string;
  text: string;
  sources: string[];
  label: string;
  coords: Coords | null;
  nation?: string;
  no_stories?: boolean;
  no_photography?: boolean;
}

export interface Person extends EntryNotes {
  id: string;
  text: string;
  sources: string[];
  label: string;
  deceased_persons?: LifeFlag;
  indigenous?: boolean;
}

export interface TimelineEntry extends EntryNotes {
  id: string;
  text: string;
  sources: string[];
  label: string;
  year: number;
}

export interface FurtherReading extends EntryNotes {
  id: string;
  text: string;
  sources: string[];
  label: string;
}

export interface ContentPack {
  meta: Meta;
  knowledge: KnowledgeEntry[];
  groups: Group[];
  stories: Story[];
  places: Place[];
  people: Person[];
  timeline: TimelineEntry[];
  further_reading: FurtherReading[];
}

export type ParseMode = 'source' | 'public';

const PUBLISH_STATUSES: PublishStatus[] = ['link-only', 'summary-with-credit', 'summary-pending-review'];
const GEOMETRY_KEYS = ['geometry', 'polygon', 'polygons', 'boundary', 'boundaries', 'geojson'];

export function badgeKind(label: string): BadgeKind {
  if (/^evidence\b/i.test(label)) return 'evidence';
  if (/^inference\b/i.test(label)) return 'inference';
  if (/^abstract-only\b/i.test(label) || /^abstract only\b/i.test(label)) return 'abstract-only';
  throw new Error(`Unrecognised label: ${label}`);
}

export function parseSources(value: unknown): Source[] {
  if (!Array.isArray(value)) throw new Error('sources must be an array');
  const sources = value.map((item, index) => parseSource(item, index));
  const seen = new Set<string>();
  sources.forEach((source) => {
    if (seen.has(source.id)) throw new Error(`Duplicate source ${source.id}`);
    seen.add(source.id);
  });
  return sources;
}

export function parseContent(value: unknown, sources: Source[], mode: ParseMode = 'source'): ContentPack {
  const record = asRecord(value, 'content');
  const byId = new Map(sources.map((source) => [source.id, source]));
  const content: ContentPack = {
    meta: parseMeta(record.meta, mode),
    knowledge: asArray(record.knowledge, 'knowledge').map((item) => parseKnowledge(item, byId)),
    groups: asArray(record.groups, 'groups').map((item) => parseGroup(item, byId)),
    stories: asArray(record.stories, 'stories').map((item) => parseStory(item, byId, mode)),
    places: asArray(record.places, 'places').map((item) => parsePlace(item, byId)),
    people: asArray(record.people, 'people').map((item) => parsePerson(item, byId)),
    timeline: asArray(record.timeline, 'timeline').map((item) => parseTimeline(item, byId)),
    further_reading: asArray(record.further_reading, 'further_reading').map((item) => parseReading(item, byId)),
  };
  assertUnique(
    [
      ...content.knowledge,
      ...content.groups,
      ...content.stories,
      ...content.places,
      ...content.people,
      ...content.timeline,
      ...content.further_reading,
    ].map((entry) => entry.id),
  );
  return content;
}

function parseSource(value: unknown, index: number): Source {
  const record = asRecord(value, `sources[${index}]`);
  return {
    id: asId(record.id, 'source id'),
    title: asText(record.title, 'source title'),
    author_org: asText(record.author_org, 'author_org'),
    url: asUrl(record.url),
    date_accessed: asText(record.date_accessed, 'date_accessed'),
    quality: asText(record.quality, 'quality'),
  };
}

function parseMeta(value: unknown, mode: ParseMode): Meta {
  const record = asRecord(value, 'meta');
  const meta: Meta = {
    pack: asText(record.pack, 'pack'),
    version: asNumber(record.version, 'version'),
    created: asText(record.created, 'created'),
    map_caveat: asText(record.map_caveat, 'map_caveat'),
    deceased_persons_warning_default: asText(record.deceased_persons_warning_default, 'deceased warning'),
  };
  if (mode === 'source' && record.deceased_warning_note != null) {
    meta.deceased_warning_note = asText(record.deceased_warning_note, 'deceased_warning_note');
  }
  return meta;
}

function parseKnowledge(value: unknown, sources: Map<string, Source>): KnowledgeEntry {
  const record = asRecord(value, 'knowledge');
  const id = asId(record.id, 'knowledge id');
  assertNoGeometry(record, id);
  const entry: KnowledgeEntry = {
    id,
    text: asText(record.text, `${id} text`),
    sources: parseSourceIds(record.sources, sources, id),
    label: asLabel(record.label, id),
  };
  const nation = optionalText(record.nation);
  if (nation) entry.nation = nation;
  copyNotes(record, entry);
  return entry;
}

function parseGroup(value: unknown, sources: Map<string, Source>): Group {
  const record = asRecord(value, 'group');
  const id = asId(record.id, 'group id');
  assertNoGeometry(record, id);
  const group: Group = {
    id,
    text: asText(record.text, `${id} text`),
    sources: parseSourceIds(record.sources, sources, id),
    label: asLabel(record.label, id),
    name: asText(record.name, `${id} name`),
    status: asStatus(record.status, id),
    approximate_location: parseCoords(record.approximate_location, id),
    boundary_caveat: asText(record.boundary_caveat, `${id} boundary_caveat`),
  };
  const languages = optionalStringList(record.languages);
  if (languages) group.languages = languages;
  const austlang = optionalStringList(record.austlang);
  if (austlang) group.austlang = austlang;
  if (record.torres_strait != null) group.torres_strait = asBoolean(record.torres_strait, `${id} torres_strait`);
  copyNotes(record, group);
  return group;
}

function parseStory(value: unknown, sources: Map<string, Source>, mode: ParseMode): Story {
  const record = asRecord(value, 'story');
  const id = asId(record.id, 'story id');
  assertNoGeometry(record, id);
  rejectLooseCoords(record, id);
  const publishStatus = asPublishStatus(record.publish_status, id);
  let summary: string | null;
  if (record.public_summary == null) {
    if (mode === 'source') throw new Error(`${id} needs public_summary`);
    summary = null;
  } else {
    summary = asText(record.public_summary, `${id} public_summary`);
  }
  // Link-only stories (Kuniya & Liru, Seven Sisters) are not retold.
  if (mode === 'public' && publishStatus === 'link-only') summary = null;
  const story: Story = {
    id,
    title: asText(record.title, `${id} title`),
    nation: asText(record.nation, `${id} nation`),
    place: asText(record.place, `${id} place`),
    public_summary: summary,
    sources: parseSourceIds(record.sources, sources, id),
    label: asLabel(record.label, id),
    publish_status: publishStatus,
    secret_sacred: asBoolean(record.secret_sacred, `${id} secret_sacred`),
    deceased_persons: asLifeFlag(record.deceased_persons, `${id} deceased_persons`),
  };
  const note = optionalText(record.deceased_note);
  if (note) story.deceased_note = note;
  if (record.exclude_from_build != null) {
    story.exclude_from_build = asBoolean(record.exclude_from_build, `${id} exclude_from_build`);
  }
  if (record.no_designs != null) story.no_designs = asBoolean(record.no_designs, `${id} no_designs`);
  copyNotes(record, story);
  return story;
}

function parsePlace(value: unknown, sources: Map<string, Source>): Place {
  const record = asRecord(value, 'place');
  const id = asId(record.id, 'place id');
  assertNoGeometry(record, id);
  const place: Place = {
    id,
    text: asText(record.text, `${id} text`),
    sources: parseSourceIds(record.sources, sources, id),
    label: asLabel(record.label, id),
    coords: parseCoords(record.coords, id),
  };
  const nation = optionalText(record.nation);
  if (nation) place.nation = nation;
  if (record.no_stories != null) place.no_stories = asBoolean(record.no_stories, `${id} no_stories`);
  if (record.no_photography != null) place.no_photography = asBoolean(record.no_photography, `${id} no_photography`);
  copyNotes(record, place);
  return place;
}

function parsePerson(value: unknown, sources: Map<string, Source>): Person {
  const record = asRecord(value, 'person');
  const id = asId(record.id, 'person id');
  assertNoGeometry(record, id);
  rejectLooseCoords(record, id);
  const person: Person = {
    id,
    text: asText(record.text, `${id} text`),
    sources: parseSourceIds(record.sources, sources, id),
    label: asLabel(record.label, id),
  };
  if (record.deceased_persons != null) person.deceased_persons = asLifeFlag(record.deceased_persons, `${id} deceased_persons`);
  if (record.indigenous != null) person.indigenous = asBoolean(record.indigenous, `${id} indigenous`);
  copyNotes(record, person);
  return person;
}

function parseTimeline(value: unknown, sources: Map<string, Source>): TimelineEntry {
  const record = asRecord(value, 'timeline');
  const id = asId(record.id, 'timeline id');
  assertNoGeometry(record, id);
  rejectLooseCoords(record, id);
  const entry: TimelineEntry = {
    id,
    text: asText(record.text, `${id} text`),
    sources: parseSourceIds(record.sources, sources, id),
    label: asLabel(record.label, id),
    year: asNumber(record.year, `${id} year`),
  };
  copyNotes(record, entry);
  return entry;
}

function parseReading(value: unknown, sources: Map<string, Source>): FurtherReading {
  const record = asRecord(value, 'further_reading');
  const id = asId(record.id, 'reading id');
  assertNoGeometry(record, id);
  rejectLooseCoords(record, id);
  const entry: FurtherReading = {
    id,
    text: asText(record.text, `${id} text`),
    sources: parseSourceIds(record.sources, sources, id),
    label: asLabel(record.label, id),
  };
  copyNotes(record, entry);
  return entry;
}

function copyNotes(record: Record<string, unknown>, target: EntryNotes): void {
  const sensitivity = optionalText(record.sensitivity);
  if (sensitivity) target.sensitivity = sensitivity;
  const uncertainty = optionalText(record.uncertainty);
  if (uncertainty) target.uncertainty = uncertainty;
  const debate = optionalText(record.debate);
  if (debate) target.debate = debate;
  if (record.example != null) target.example = asBoolean(record.example, 'example');
}

function parseCoords(value: unknown, id: string): Coords | null {
  if (value == null) return null;
  const record = asRecord(value, `${id} coords`);
  const lat = asNumber(record.lat, `${id} lat`);
  const lon = asNumber(record.lon, `${id} lon`);
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) throw new Error(`${id} coords out of range`);
  const coords: Coords = { lat, lon };
  const format = optionalText(record.source_format);
  if (format) coords.source_format = format;
  return coords;
}

function rejectLooseCoords(record: Record<string, unknown>, id: string): void {
  if ('coords' in record || 'approximate_location' in record || 'lat' in record || 'lon' in record) {
    throw new Error(`${id} must not carry coordinates`);
  }
}

function parseSourceIds(value: unknown, sources: Map<string, Source>, id: string): string[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error(`${id} needs a source`);
  return value.map((item) => {
    const sourceId = asId(item, `${id} source`);
    if (!sources.has(sourceId)) throw new Error(`${id} missing source ${sourceId}`);
    return sourceId;
  });
}

function assertNoGeometry(record: Record<string, unknown>, id: string): void {
  GEOMETRY_KEYS.forEach((key) => {
    if (key in record) throw new Error(`${id} must not include ${key}`);
  });
}

function assertUnique(ids: string[]): void {
  const seen = new Set<string>();
  ids.forEach((id) => {
    if (seen.has(id)) throw new Error(`Duplicate id ${id}`);
    seen.add(id);
  });
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
  return value as Record<string, unknown>;
}

function asArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function asText(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error(`${label} must be text`);
  return value;
}

function asId(value: unknown, label: string): string {
  return asText(value, label);
}

function optionalText(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error('optional text');
  return value;
}

function optionalStringList(value: unknown): string[] | undefined {
  if (value == null) return undefined;
  if (!Array.isArray(value)) throw new Error('list');
  return value.map((item) => asText(item, 'list item'));
}

function asBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`${label} must be boolean`);
  return value;
}

function asLifeFlag(value: unknown, label: string): LifeFlag {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string' && value.trim().length > 0) return value;
  throw new Error(`${label} must be boolean or text`);
}

function asNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${label} must be a number`);
  return value;
}

function asUrl(value: unknown): string {
  const url = asText(value, 'url');
  if (!/^https?:\/\//i.test(url)) throw new Error(`url ${url}`);
  return url;
}

function asLabel(value: unknown, id: string): string {
  const label = asText(value, `${id} label`);
  badgeKind(label);
  return label;
}

function asStatus(value: unknown, id: string): EraStatus {
  if (value === 'present' || value === 'historic') return value;
  throw new Error(`${id} status`);
}

function asPublishStatus(value: unknown, id: string): PublishStatus {
  if (typeof value === 'string' && PUBLISH_STATUSES.includes(value as PublishStatus)) return value as PublishStatus;
  throw new Error(`${id} publish_status`);
}
