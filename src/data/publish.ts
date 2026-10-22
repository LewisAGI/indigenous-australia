import { parseContent, parseSources } from './schema.ts';
import type { ContentPack, PublishStatus, Source, Story } from './schema.ts';

export interface PublicMeta {
  pack: string;
  version: number;
  created: string;
  map_caveat: string;
  deceased_persons_warning_default: string;
}

export interface PublicCatalog {
  sources: Source[];
  content: {
    meta: PublicMeta;
    knowledge: ContentPack['knowledge'];
    groups: ContentPack['groups'];
    stories: Story[];
    places: ContentPack['places'];
    people: ContentPack['people'];
    timeline: ContentPack['timeline'];
    further_reading: ContentPack['further_reading'];
  };
}

interface Publishable {
  sources: string[];
  label: string;
  sensitivity?: string;
  publish_status?: PublishStatus;
  secret_sacred?: boolean;
  exclude_from_build?: boolean;
  boundary_caveat?: string;
}

/** Unchecked search-summary labels stay out of the build. Verified v3 labels do not match. */
export function isSearchSummaryLabel(label: string): boolean {
  return /search[-\s]?summary/i.test(label);
}

/** A source the pack only saw as a search summary or a search-result extract. */
export function isUncheckedQuality(quality: string): boolean {
  return /search[-\s]?summary/i.test(quality) || /search result page extract/i.test(quality) || /\bunchecked\b/i.test(quality);
}

export function hasCheckedSource(ids: string[], sources: Source[]): boolean {
  return ids.some((id) => {
    const source = sources.find((item) => item.id === id);
    return source ? !isUncheckedQuality(source.quality) : false;
  });
}

/**
 * Knowledge flagged "RESTRICTED -" is the pack telling us not to publish that material.
 * Stories keep their own publish_status. Places and nations are not notices.
 */
export function isRestrictedNotice(entry: Publishable): boolean {
  if (entry.publish_status || entry.boundary_caveat) return false;
  const sensitivity = entry.sensitivity ?? '';
  return /^restricted\s+-/i.test(sensitivity) || /do not (seek or )?publish/i.test(sensitivity);
}

export function isPublicRecord(entry: Publishable, sources: Source[]): boolean {
  if (!hasCheckedSource(entry.sources, sources)) return false;
  if (isSearchSummaryLabel(entry.label)) return false;
  if (entry.secret_sacred) return false;
  if (entry.exclude_from_build) return false;
  if (entry.publish_status === 'summary-pending-review') return false;
  if (isRestrictedNotice(entry)) return false;
  return true;
}

export function isPublishedStory(story: Story): boolean {
  if (story.exclude_from_build) return false;
  if (story.secret_sacred) return false;
  if (story.publish_status === 'summary-pending-review') return false;
  if (isSearchSummaryLabel(story.label)) return false;
  if (/^(kata\s*tjuta|wollumbin)\b/i.test(story.place)) return false;
  return true;
}

export function toPublicCatalog(contentInput: unknown, sourcesInput: unknown): PublicCatalog {
  const sources = parseSources(sourcesInput);
  const content = parseContent(contentInput, sources, 'source');
  return publishParsed(content, sources);
}

export function parsePublicCatalog(value: unknown): PublicCatalog {
  const record = asRecord(value);
  const sources = parseSources(record.sources);
  const content = parseContent(record.content, sources, 'public');
  return publishParsed(content, sources);
}

function publishParsed(content: ContentPack, sources: Source[]): PublicCatalog {
  const meta: PublicMeta = {
    pack: content.meta.pack,
    version: content.meta.version,
    created: content.meta.created,
    map_caveat: content.meta.map_caveat,
    deceased_persons_warning_default: content.meta.deceased_persons_warning_default,
  };
  const keep = <T extends Publishable>(entries: T[]): T[] => entries.filter((entry) => isPublicRecord(entry, sources)).map((entry) => scrubEntry(entry));
  const stories = content.stories
    .filter((story) => isPublishedStory(story) && isPublicRecord(story, sources))
    .map((story) => scrubEntry(story))
    .map(stripRetelling);
  const published = {
    meta,
    knowledge: keep(content.knowledge),
    groups: keep(content.groups),
    stories,
    places: keep(content.places),
    people: keep(content.people),
    timeline: keep(content.timeline),
    further_reading: keep(content.further_reading),
  };
  const used = usedSourceIds(published);
  return {
    sources: sources.filter((source) => used.has(source.id)),
    content: published,
  };
}

function stripRetelling(story: Story): Story {
  if (story.publish_status !== 'link-only') return story;
  return { ...story, public_summary: null };
}

/** Drop an unchecked aside without rewriting the sourced sentence around it. */
export function scrubText(value: string): string {
  return value.replace(/\s*\([^)]*\bsearch[-\s]?summary\b[^)]*\)/gi, '').replace(/[ \t]{2,}/g, ' ').trim();
}

function scrubEntry<T extends Publishable>(entry: T): T {
  const next: Record<string, unknown> = { ...(entry as unknown as Record<string, unknown>) };
  ['text', 'title', 'place', 'nation', 'public_summary', 'name', 'sensitivity', 'uncertainty', 'debate', 'deceased_note'].forEach((key) => {
    const value = next[key];
    if (typeof value === 'string') next[key] = scrubText(value);
  });
  return next as T;
}

function usedSourceIds(content: PublicCatalog['content']): Set<string> {
  const ids = new Set<string>();
  const entries = [
    ...content.knowledge,
    ...content.groups,
    ...content.places,
    ...content.stories,
    ...content.people,
    ...content.timeline,
    ...content.further_reading,
  ];
  entries.forEach((entry) => entry.sources.forEach((id) => ids.add(id)));
  return ids;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('catalog must be an object');
  return value as Record<string, unknown>;
}
