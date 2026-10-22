import type { PublicCatalog } from '../data/publish';
import {
  filterGroups,
  filterKnowledge,
  filterPeople,
  filterPlaces,
  filterReading,
  filterStories,
  filterTimeline,
  glossaryTerms,
  groupsForPlace,
  isStoryFreePlace,
  knowledgeForBlob,
  lifeStatus,
  nationSnapshot,
  needsDeceasedWarning,
  peopleForBlob,
  personName,
  placesForNation,
  pointUncertainty,
  shortTitle,
  sortTimeline,
  storiesForNation,
  storiesForPlace,
  storyBody,
  timelineForBlob,
} from '../data/present';
import type { EraStatus, Group, KnowledgeEntry, Person, Place, Story, TimelineEntry } from '../data/schema';
import { PermissionBadge } from './Badge';
import { AustlangList, ExampleFlag, InferenceLine, LabelBadge, Notes, ProtocolNotes, SourceList, WarningCopy } from './bits';
import { IconMap } from './icons';
import { IconButton } from './IconButton';

type Catalog = PublicCatalog;
export type Detail =
  | { type: 'group'; id: string }
  | { type: 'place'; id: string }
  | { type: 'story'; id: string }
  | { type: 'person'; id: string }
  | { type: 'timeline'; id: string }
  | { type: 'knowledge'; id: string }
  | { type: 'reading'; id: string };

export type Open = (detail: Detail) => void;

export function NationsPage({
  catalog,
  era,
  torresOnly,
  onOpen,
}: {
  catalog: Catalog;
  era: EraStatus;
  torresOnly: boolean;
  onOpen: Open;
}) {
  const groups = filterGroups(catalog.content.groups, era, torresOnly);
  return (
    <div className="page stack" data-page="nations">
      {groups.length === 0 ? <p data-empty="nations">None in this pack.</p> : null}
      {groups.map((group) => (
        <button key={group.id} type="button" className="menu-item" data-entry={group.id} onClick={() => onOpen({ type: 'group', id: group.id })}>
          <span className="row-title">{group.name}</span>
          {group.torres_strait ? <span className="badge">Torres Strait</span> : null}
          {group.status === 'historic' ? <span className="badge">Historic</span> : null}
        </button>
      ))}
    </div>
  );
}

export function GroupDetail({ catalog, group, onOpen }: { catalog: Catalog; group: Group; onOpen: Open }) {
  const places = placesForNation(group, catalog.content.places);
  const stories = storiesForNation(group, catalog.content.stories);
  const people = peopleForBlob(`${group.name} ${group.text}`, catalog.content.people);
  const knowledge = knowledgeForBlob(group.name, catalog.content.knowledge).filter((entry) => entry.id !== group.id);
  return (
    <article data-entry={group.id} data-page="nation">
      <ExampleFlag entry={group} />
      <h2 className="popup-title">{group.name}</h2>
      <LabelBadge label={group.label} />
      <p>{group.text}</p>
      <p className="boundary" data-caveat="group">
        {group.boundary_caveat}
      </p>
      {group.languages?.map((language) => (
        <InferenceLine key={language} value={language} />
      ))}
      <AustlangList codes={group.austlang} sources={catalog.sources} />
      <Notes uncertainty={group.uncertainty} debate={group.debate} sensitivity={group.sensitivity} />
      <LinkList title="Places" items={places.map((place) => ({ id: place.id, label: shortTitle(place.text), type: 'place' as const }))} onOpen={onOpen} />
      <LinkList title="Stories" items={stories.map((story) => ({ id: story.id, label: story.title, type: 'story' as const }))} onOpen={onOpen} />
      <LinkList title="People" items={people.map((person) => ({ id: person.id, label: personName(person), type: 'person' as const }))} onOpen={onOpen} />
      <LinkList title="Knowledge" items={knowledge.map((entry) => ({ id: entry.id, label: shortTitle(entry.text), type: 'knowledge' as const }))} onOpen={onOpen} />
      <SourceList ids={group.sources} sources={catalog.sources} />
    </article>
  );
}

export function PlacesPage({ catalog, torresOnly, onOpen }: { catalog: Catalog; torresOnly: boolean; onOpen: Open }) {
  const places = filterPlaces(catalog.content.places, catalog.content.groups, torresOnly);
  return (
    <div className="page stack" data-page="places">
      {places.length === 0 ? <p data-empty="places">None in this pack.</p> : null}
      {places.map((place) => (
        <button
          key={place.id}
          type="button"
          className="menu-item"
          data-entry={place.id}
          data-coords={place.coords ? 'sourced' : 'none'}
          data-stories={isStoryFreePlace(place) ? 'none' : 'allowed'}
          onClick={() => onOpen({ type: 'place', id: place.id })}
        >
          <span className="row-title">{shortTitle(place.text)}</span>
          {place.nation ? <span className="popup-place">{place.nation}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function PlaceDetail({
  catalog,
  place,
  onOpen,
  onMap,
}: {
  catalog: Catalog;
  place: Place;
  onOpen: Open;
  onMap: (id: string) => void;
}) {
  const groups = groupsForPlace(place, catalog.content.groups);
  const stories = storiesForPlace(place, catalog.content.stories);
  const people = peopleForBlob(`${place.text} ${place.nation ?? ''}`, catalog.content.people);
  const timeline = timelineForBlob(shortTitle(place.text), catalog.content.timeline);
  return (
    <article data-entry={place.id} data-page="place" data-stories={isStoryFreePlace(place) ? 'none' : 'allowed'} data-coords={place.coords ? 'sourced' : 'none'}>
      <ExampleFlag entry={place} />
      <h2 className="popup-title">{shortTitle(place.text)}</h2>
      {isStoryFreePlace(place) ? (
        <p className="protocol" data-stories="none">
          No story is published for this place.
        </p>
      ) : null}
      <LabelBadge label={place.label} />
      <ProtocolNotes entry={place} />
      <p>{place.text}</p>
      {place.coords ? (
        <p className="popup-note" data-point="sourced">
          {pointUncertainty(place.coords.source_format)}
        </p>
      ) : null}
      <Notes uncertainty={place.uncertainty} debate={place.debate} sensitivity={place.sensitivity} />
      {place.coords ? (
        <IconButton label="Show on map" onClick={() => onMap(place.id)}>
          <IconMap />
        </IconButton>
      ) : null}
      {groups.map((group) => (
        <p key={group.id} className="boundary" data-caveat="group">
          {group.boundary_caveat}
        </p>
      ))}
      <LinkList title="Nations" items={groups.map((group) => ({ id: group.id, label: group.name, type: 'group' as const }))} onOpen={onOpen} />
      <LinkList title="Stories" items={stories.map((story) => ({ id: story.id, label: story.title, type: 'story' as const }))} onOpen={onOpen} />
      <LinkList title="People" items={people.map((person) => ({ id: person.id, label: personName(person), type: 'person' as const }))} onOpen={onOpen} />
      <LinkList title="Timeline" items={timeline.map((entry) => ({ id: entry.id, label: String(entry.year), type: 'timeline' as const }))} onOpen={onOpen} />
      <SourceList ids={place.sources} sources={catalog.sources} />
    </article>
  );
}

export function StoriesPage({ catalog, torresOnly, onOpen }: { catalog: Catalog; torresOnly: boolean; onOpen: Open }) {
  const stories = filterStories(catalog.content.stories, catalog.content.groups, torresOnly);
  return (
    <div className="page stack" data-page="stories">
      {stories.length === 0 ? <p data-empty="stories">None in this pack.</p> : null}
      {stories.map((story) => (
        <button key={story.id} type="button" className="menu-item" data-entry={story.id} data-publish={story.publish_status} onClick={() => onOpen({ type: 'story', id: story.id })}>
          <span className="row-title">{story.title}</span>
          {story.publish_status === 'link-only' ? null : <span className="popup-place">{story.nation}</span>}
        </button>
      ))}
    </div>
  );
}

export function StoryDetail({ catalog, story, onOpen }: { catalog: Catalog; story: Story; onOpen: Open }) {
  const groups = catalog.content.groups.filter((group) => storiesForNation(group, [story]).some((item) => item.id === story.id));
  const places = catalog.content.places.filter((place) => storyMatches(place, story));
  const people = peopleForBlob(`${story.title} ${story.nation} ${story.place} ${storyBody(story) ?? ''}`, catalog.content.people);
  const timeline = timelineForBlob(`${story.title} ${story.place}`, catalog.content.timeline);
  return (
    <article data-entry={story.id} data-page="story" data-publish={story.publish_status}>
      <StoryBody catalog={catalog} story={story} />
      {story.publish_status === 'link-only' ? null : (
        <>
          <LinkList title="Nations" items={groups.map((group) => ({ id: group.id, label: group.name, type: 'group' as const }))} onOpen={onOpen} />
          <LinkList title="Places" items={places.map((place) => ({ id: place.id, label: shortTitle(place.text), type: 'place' as const }))} onOpen={onOpen} />
          <LinkList title="People" items={people.map((person) => ({ id: person.id, label: personName(person), type: 'person' as const }))} onOpen={onOpen} />
          <LinkList title="Timeline" items={timeline.map((entry) => ({ id: entry.id, label: String(entry.year), type: 'timeline' as const }))} onOpen={onOpen} />
        </>
      )}
    </article>
  );
}

function storyMatches(place: Place, story: Story): boolean {
  return storiesForPlace(place, [story]).length > 0;
}

function StoryBody({ catalog, story }: { catalog: Catalog; story: Story }) {
  const body = storyBody(story);
  const warning = catalog.content.meta.deceased_persons_warning_default;
  return (
    <>
      <ExampleFlag entry={story} />
      {needsDeceasedWarning(story.deceased_persons) ? <WarningCopy text={warning} scope="story" /> : null}
      <h2 className="popup-title">{story.title}</h2>
      {story.publish_status === 'link-only' ? null : (
        <>
          <p className="popup-place">{story.nation}</p>
          <p className="popup-place">{story.place}</p>
          <LabelBadge label={story.label} />
          <PermissionBadge status={story.publish_status} />
          <ProtocolNotes entry={story} />
          {body ? <p data-summary="">{body}</p> : null}
          <Notes uncertainty={story.uncertainty} debate={story.debate} sensitivity={story.sensitivity} />
        </>
      )}
      <SourceList ids={story.sources} sources={catalog.sources} compact={story.publish_status === 'link-only'} />
    </>
  );
}

export function PeoplePage({ catalog, torresOnly, onOpen }: { catalog: Catalog; torresOnly: boolean; onOpen: Open }) {
  const people = filterPeople(catalog.content.people, torresOnly);
  return (
    <div className="page stack" data-page="people">
      {people.length === 0 ? <p data-empty="people">None in this pack.</p> : null}
      {people.map((person) => (
        <button key={person.id} type="button" className="menu-item" data-entry={person.id} data-life={lifeStatus(person.deceased_persons)} onClick={() => onOpen({ type: 'person', id: person.id })}>
          <span className="row-title">{personName(person)}</span>
        </button>
      ))}
    </div>
  );
}

export function PersonDetail({ catalog, person, onOpen }: { catalog: Catalog; person: Person; onOpen: Open }) {
  const status = lifeStatus(person.deceased_persons);
  const warning = catalog.content.meta.deceased_persons_warning_default;
  const stories = catalog.content.stories.filter((story) => peopleForBlob(`${story.title} ${story.nation} ${story.place} ${story.public_summary ?? ''}`, [person]).length > 0);
  const groups = catalog.content.groups.filter((group) => peopleForBlob(`${group.name} ${group.text}`, [person]).length > 0);
  return (
    <article data-entry={person.id} data-page="person" data-life={status} data-indigenous={person.indigenous === false ? 'false' : person.indigenous === true ? 'true' : 'unset'}>
      <ExampleFlag entry={person} />
      {needsDeceasedWarning(person.deceased_persons) ? <WarningCopy text={warning} scope="person" /> : null}
      <h2 className="popup-title">{personName(person)}</h2>
      <span className="badge">{status === 'living' ? 'Living' : status === 'deceased' ? 'Deceased' : 'Unconfirmed'}</span>
      {person.indigenous === false ? <span className="badge">Not Indigenous</span> : null}
      <LabelBadge label={person.label} />
      <p>{person.text}</p>
      <Notes uncertainty={person.uncertainty} debate={person.debate} sensitivity={person.sensitivity} />
      <LinkList title="Nations" items={groups.map((group) => ({ id: group.id, label: group.name, type: 'group' as const }))} onOpen={onOpen} />
      <LinkList title="Stories" items={stories.map((story) => ({ id: story.id, label: story.title, type: 'story' as const }))} onOpen={onOpen} />
      <SourceList ids={person.sources} sources={catalog.sources} />
    </article>
  );
}

export function TimelinePage({ catalog, torresOnly, onOpen }: { catalog: Catalog; torresOnly: boolean; onOpen: Open }) {
  const entries = sortTimeline(filterTimeline(catalog.content.timeline, torresOnly));
  return (
    <ol className="page timeline" data-page="timeline">
      {entries.length === 0 ? <li data-empty="timeline">None in this pack.</li> : null}
      {entries.map((entry) => (
        <li key={entry.id} data-entry={entry.id} data-year={entry.year}>
          <button type="button" className="menu-item" onClick={() => onOpen({ type: 'timeline', id: entry.id })}>
            <span className="row-title">{entry.year}</span>
            <span className="popup-place">{shortTitle(entry.text)}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

export function TimelineDetail({ catalog, entry, onOpen }: { catalog: Catalog; entry: TimelineEntry; onOpen: Open }) {
  const places = catalog.content.places.filter((place) => timelineForBlob(shortTitle(place.text), [entry]).length > 0);
  const stories = catalog.content.stories.filter((story) => timelineForBlob(`${story.title} ${story.place}`, [entry]).length > 0);
  const people = catalog.content.people.filter((person) => timelineForBlob(person.text, [entry]).length > 0);
  const knowledge = knowledgeForBlob(entry.text, catalog.content.knowledge);
  return (
    <article data-entry={entry.id} data-page="timeline-entry" data-year={entry.year}>
      <ExampleFlag entry={entry} />
      <h2 className="popup-title">{entry.year}</h2>
      <LabelBadge label={entry.label} />
      <p>{entry.text}</p>
      <Notes uncertainty={entry.uncertainty} debate={entry.debate} sensitivity={entry.sensitivity} />
      <LinkList title="Places" items={places.map((place) => ({ id: place.id, label: shortTitle(place.text), type: 'place' as const }))} onOpen={onOpen} />
      <LinkList title="Stories" items={stories.map((story) => ({ id: story.id, label: story.title, type: 'story' as const }))} onOpen={onOpen} />
      <LinkList title="People" items={people.map((person) => ({ id: person.id, label: personName(person), type: 'person' as const }))} onOpen={onOpen} />
      <LinkList title="Knowledge" items={knowledge.map((item) => ({ id: item.id, label: shortTitle(item.text), type: 'knowledge' as const }))} onOpen={onOpen} />
      <SourceList ids={entry.sources} sources={catalog.sources} />
    </article>
  );
}

export function KnowledgePage({ catalog, torresOnly, onOpen }: { catalog: Catalog; torresOnly: boolean; onOpen: Open }) {
  const entries = filterKnowledge(catalog.content.knowledge, torresOnly);
  return (
    <div className="page stack" data-page="knowledge">
      {entries.length === 0 ? <p data-empty="knowledge">None in this pack.</p> : null}
      {entries.map((entry) => (
        <button key={entry.id} type="button" className="menu-item" data-entry={entry.id} data-spotlight={entry.id === 'k3' ? 'languages' : undefined} onClick={() => onOpen({ type: 'knowledge', id: entry.id })}>
          <span className="row-title">{shortTitle(entry.text)}</span>
        </button>
      ))}
    </div>
  );
}

export function KnowledgeDetail({ catalog, entry, onOpen }: { catalog: Catalog; entry: KnowledgeEntry; onOpen: Open }) {
  const groups = catalog.content.groups.filter((group) => knowledgeForBlob(group.name, [entry]).length > 0 || (entry.nation ? group.name.toLowerCase().includes(entry.nation.toLowerCase()) || entry.nation.toLowerCase().includes(group.name.split('(')[0].trim().toLowerCase()) : false));
  return (
    <article data-entry={entry.id} data-page="knowledge-entry" data-spotlight={entry.id === 'k3' ? 'languages' : undefined}>
      <ExampleFlag entry={entry} />
      <h2 className="popup-title">{shortTitle(entry.text)}</h2>
      <LabelBadge label={entry.label} />
      <ProtocolNotes entry={entry} />
      {entry.nation ? <InferenceLine value={entry.nation} /> : null}
      <p>{entry.text}</p>
      <Notes uncertainty={entry.uncertainty} debate={entry.debate} sensitivity={entry.sensitivity} />
      <LinkList title="Nations" items={groups.map((group) => ({ id: group.id, label: group.name, type: 'group' as const }))} onOpen={onOpen} />
      <SourceList ids={entry.sources} sources={catalog.sources} />
    </article>
  );
}

export function ReadingPage({ catalog, torresOnly, onOpen }: { catalog: Catalog; torresOnly: boolean; onOpen: Open }) {
  const entries = filterReading(catalog.content.further_reading, torresOnly);
  return (
    <div className="page stack" data-page="reading">
      {entries.length === 0 ? <p data-empty="reading">None in this pack.</p> : null}
      {entries.map((entry) => (
        <button key={entry.id} type="button" className="menu-item" data-entry={entry.id} onClick={() => onOpen({ type: 'reading', id: entry.id })}>
          <span className="row-title">{shortTitle(entry.text)}</span>
        </button>
      ))}
    </div>
  );
}

export function ReadingDetail({ catalog, entry }: { catalog: Catalog; entry: Catalog['content']['further_reading'][number] }) {
  return (
    <article data-entry={entry.id} data-page="reading-entry">
      <ExampleFlag entry={entry} />
      <h2 className="popup-title">{shortTitle(entry.text)}</h2>
      <ProtocolNotes entry={entry} />
      <LabelBadge label={entry.label} />
      <p>{entry.text}</p>
      <Notes uncertainty={entry.uncertainty} debate={entry.debate} sensitivity={entry.sensitivity} />
      <SourceList ids={entry.sources} sources={catalog.sources} />
    </article>
  );
}

export function GlossaryPage({ catalog, onOpen }: { catalog: Catalog; onOpen: Open }) {
  const terms = glossaryTerms(catalog.content.knowledge);
  return (
    <div className="page stack" data-page="glossary">
      {terms.map((term) => (
        <button key={term.term} type="button" className="menu-item" data-term={term.term} onClick={() => onOpen({ type: 'knowledge', id: term.id })}>
          <span className="row-title">{term.term}</span>
        </button>
      ))}
    </div>
  );
}

export function ComparePage({ catalog, selected, onToggle, onOpen }: { catalog: Catalog; selected: string[]; onToggle: (id: string) => void; onOpen: Open }) {
  const left = catalog.content.groups.find((group) => group.id === selected[0]);
  const right = catalog.content.groups.find((group) => group.id === selected[1]);
  const pair = [left, right].filter((group): group is Group => Boolean(group)).map((group) => nationSnapshot(group, catalog.content));
  return (
    <div className="page" data-page="compare">
      {pair.length === 2 ? (
        <div className="compare">
          {pair.map((item) => (
            <article key={item.id} data-compare={item.id}>
              <h2 className="popup-title">{item.name}</h2>
              <p className="popup-note">{item.status === 'historic' ? 'Historic' : 'Present'}</p>
              {item.torres ? <p className="popup-note">Torres Strait</p> : null}
              {item.languages.map((language) => (
                <InferenceLine key={language} value={language} />
              ))}
              {item.austlang.length > 0 ? <AustlangList codes={item.austlang} sources={catalog.sources} /> : null}
              <LinkList
                title="Places"
                items={placesForNation(mustGroup(catalog, item.id), catalog.content.places).map((place) => ({ id: place.id, label: shortTitle(place.text), type: 'place' as const }))}
                onOpen={onOpen}
              />
              <LinkList
                title="Stories"
                items={storiesForNation(mustGroup(catalog, item.id), catalog.content.stories).map((story) => ({ id: story.id, label: story.title, type: 'story' as const }))}
                onOpen={onOpen}
              />
            </article>
          ))}
        </div>
      ) : null}
      <div className="stack">
        {catalog.content.groups.map((group) => (
          <button key={group.id} type="button" className="menu-item" aria-pressed={selected.includes(group.id)} data-entry={group.id} onClick={() => onToggle(group.id)}>
            <span className="row-title">{group.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function mustGroup(catalog: Catalog, id: string): Group {
  const group = catalog.content.groups.find((item) => item.id === id);
  if (!group) throw new Error('Missing nation');
  return group;
}

function LinkList({ title, items, onOpen }: { title: string; items: { id: string; label: string; type: Detail['type'] }[]; onOpen: Open }) {
  if (items.length === 0) return null;
  return (
    <div className="stack" data-links={title.toLowerCase()}>
      <h3 className="link-heading">{title}</h3>
      {items.map((item) => (
        <button key={`${item.type}-${item.id}`} type="button" className="menu-item" onClick={() => onOpen({ type: item.type, id: item.id })}>
          <span className="row-title">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
