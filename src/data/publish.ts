import { parseContent, parseSources } from './schema.ts';
import type { ContentPack, Source, Story } from './schema.ts';

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

/** Unchecked search-summary labels stay out of the build. Verified v3 labels do not match. */
export function isSearchSummaryLabel(label: string): boolean {
  return /search[-\s]?summary/i.test(label);
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
  const stories = content.stories.filter(isPublishedStory).map(stripRetelling);
  const published = { ...content, meta, stories };
  const used = usedSourceIds(published);
  return {
    sources: sources.filter((source) => used.has(source.id)),
    content: {
      meta,
      knowledge: content.knowledge,
      groups: content.groups,
      stories,
      places: content.places,
      people: content.people,
      timeline: content.timeline,
      further_reading: content.further_reading,
    },
  };
}

function stripRetelling(story: Story): Story {
  if (story.publish_status !== 'link-only') return story;
  return { ...story, public_summary: null };
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
