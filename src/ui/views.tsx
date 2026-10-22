import type { PublicCatalog } from '../data/publish';
import {
  filterGroups,
  groupsForPlace,
  isStoryFreePlace,
  lifeStatus,
  needsDeceasedWarning,
  personHeading,
  placesForNation,
  pointUncertainty,
  shortTitle,
  sortTimeline,
  storiesForNation,
  storiesForPlace,
  storyBody,
} from '../data/present';
import type { EraStatus, Group, Place, Story } from '../data/schema';
import { PermissionBadge } from './Badge';
import { AustlangList, ExampleFlag, InferenceLine, LabelBadge, Notes, ProtocolNotes, SourceList, WarningCopy } from './bits';
import { IconAll, IconHistoric, IconMap, IconPresent, IconTorres } from './icons';
import { IconButton } from './IconButton';

type Catalog = PublicCatalog;
type Open = (detail: Detail) => void;
export type Detail =
  | { type: 'group'; id: string }
  | { type: 'place'; id: string }
  | { type: 'story'; id: string };

export function NationsPage({
  catalog,
  era,
  torresOnly,
  onEra,
  onTorres,
  onOpen,
}: {
  catalog: Catalog;
  era: EraStatus;
  torresOnly: boolean;
  onEra: (era: EraStatus) => void;
  onTorres: (value: boolean) => void;
  onOpen: Open;
}) {
  const groups = filterGroups(catalog.content.groups, era, torresOnly);
  return (
    <div className="page" data-page="nations">
      <div className="icon-row">
        <IconButton label="Present" pressed={era === 'present'} onClick={() => onEra('present')}>
          <IconPresent />
        </IconButton>
        <IconButton label="Historic" pressed={era === 'historic'} onClick={() => onEra('historic')}>
          <IconHistoric />
        </IconButton>
        <IconButton label="All nations" pressed={!torresOnly} onClick={() => onTorres(false)}>
          <IconAll />
        </IconButton>
        <IconButton label="Torres Strait" pressed={torresOnly} onClick={() => onTorres(true)}>
          <IconTorres />
        </IconButton>
      </div>
      {groups.length === 0 ? <p data-empty="nations">None in this pack.</p> : null}
      <div className="stack">
        {groups.map((group) => (
          <button key={group.id} type="button" className="menu-item" onClick={() => onOpen({ type: 'group', id: group.id })}>
            <span className="row-title">{group.name}</span>
            {group.torres_strait ? <span className="badge">Torres Strait</span> : null}
            <span className="badge">{group.status === 'historic' ? 'Historic' : 'Present'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function GroupDetail({ catalog, group, onOpen }: { catalog: Catalog; group: Group; onOpen: Open }) {
  const places = placesForNation(group, catalog.content.places);
  const stories = storiesForNation(group, catalog.content.stories);
  return (
    <article data-entry={group.id}>
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
      {places.length > 0 ? (
        <div className="stack">
          {places.map((place) => (
            <button key={place.id} type="button" className="menu-item" onClick={() => onOpen({ type: 'place', id: place.id })}>
              {shortTitle(place.text)}
            </button>
          ))}
        </div>
      ) : null}
      {stories.length > 0 ? (
        <div className="stack">
          {stories.map((story) => (
            <button key={story.id} type="button" className="menu-item" onClick={() => onOpen({ type: 'story', id: story.id })}>
              {story.title}
            </button>
          ))}
        </div>
      ) : null}
      <SourceList ids={group.sources} sources={catalog.sources} />
    </article>
  );
}

export function PlacesPage({ catalog, onMap }: { catalog: Catalog; onMap: (id: string) => void }) {
  return (
    <div className="page stack" data-page="places">
      {catalog.content.places.map((place) => (
        <article key={place.id} data-entry={place.id} data-coords={place.coords ? 'sourced' : 'none'} data-stories={isStoryFreePlace(place) ? 'none' : 'allowed'}>
          <ExampleFlag entry={place} />
          <h2 className="popup-title">{shortTitle(place.text)}</h2>
          <LabelBadge label={place.label} />
          {isStoryFreePlace(place) ? <span className="badge badge-permission">Place only</span> : null}
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
          <SourceList ids={place.sources} sources={catalog.sources} />
        </article>
      ))}
    </div>
  );
}

export function PlaceDetail({ catalog, place }: { catalog: Catalog; place: Place }) {
  const groups = groupsForPlace(place, catalog.content.groups);
  const stories = storiesForPlace(place, catalog.content.stories);
  return (
    <article data-entry={place.id} data-stories={isStoryFreePlace(place) ? 'none' : 'allowed'} data-coords={place.coords ? 'sourced' : 'none'}>
      <h2 className="popup-title">{shortTitle(place.text)}</h2>
      <ProtocolNotes entry={place} />
      <p>{place.text}</p>
      {place.coords ? <p className="popup-note">{pointUncertainty(place.coords.source_format)}</p> : null}
      {groups.map((group) => (
        <p key={group.id} className="boundary" data-caveat="group">
          {group.boundary_caveat}
        </p>
      ))}
      {stories.map((story) => (
        <StoryBlock key={story.id} catalog={catalog} story={story} />
      ))}
      <SourceList ids={place.sources} sources={catalog.sources} />
    </article>
  );
}

export function StoriesPage({ catalog }: { catalog: Catalog }) {
  return (
    <div className="page stack" data-page="stories">
      {catalog.content.stories.map((story) => (
        <StoryBlock key={story.id} catalog={catalog} story={story} />
      ))}
    </div>
  );
}

export function StoryBlock({ catalog, story }: { catalog: Catalog; story: Story }) {
  const body = storyBody(story);
  const warning = catalog.content.meta.deceased_persons_warning_default;
  return (
    <article data-entry={story.id} data-publish={story.publish_status}>
      <ExampleFlag entry={story} />
      {needsDeceasedWarning(story.deceased_persons) ? <WarningCopy text={warning} scope="story" /> : null}
      {story.deceased_note ? <p className="popup-note">{story.deceased_note}</p> : null}
      <h2 className="popup-title">{story.title}</h2>
      <p className="popup-place">{story.nation}</p>
      <p className="popup-place">{story.place}</p>
      <LabelBadge label={story.label} />
      <PermissionBadge status={story.publish_status} />
      <ProtocolNotes entry={story} />
      {body ? <p>{body}</p> : null}
      <Notes uncertainty={story.uncertainty} debate={story.debate} sensitivity={story.sensitivity} />
      <SourceList ids={story.sources} sources={catalog.sources} />
    </article>
  );
}

export function PeoplePage({ catalog }: { catalog: Catalog }) {
  const warning = catalog.content.meta.deceased_persons_warning_default;
  return (
    <div className="page stack" data-page="people">
      {catalog.content.people.map((person) => {
        const status = lifeStatus(person.deceased_persons);
        return (
          <article
            key={person.id}
            data-entry={person.id}
            data-life={status}
            data-indigenous={person.indigenous === false ? 'false' : person.indigenous === true ? 'true' : 'unset'}
          >
            <ExampleFlag entry={person} />
            {needsDeceasedWarning(person.deceased_persons) ? <WarningCopy text={warning} scope="person" /> : null}
            <h2 className="popup-title">{personHeading(person)}</h2>
            <span className="badge">{status === 'living' ? 'Living' : status === 'deceased' ? 'Deceased' : 'Unconfirmed'}</span>
            {person.indigenous === false ? <span className="badge">Not Indigenous</span> : null}
            <LabelBadge label={person.label} />
            <p>{person.text}</p>
            <Notes uncertainty={person.uncertainty} debate={person.debate} sensitivity={person.sensitivity} />
            <SourceList ids={person.sources} sources={catalog.sources} />
          </article>
        );
      })}
    </div>
  );
}

export function TimelinePage({ catalog }: { catalog: Catalog }) {
  const entries = sortTimeline(catalog.content.timeline);
  return (
    <ol className="page timeline" data-page="timeline">
      {entries.map((entry) => (
        <li key={entry.id} data-entry={entry.id} data-year={entry.year}>
          <ExampleFlag entry={entry} />
          <h2 className="popup-title">{entry.year}</h2>
          <LabelBadge label={entry.label} />
          <p>{entry.text}</p>
          <Notes uncertainty={entry.uncertainty} debate={entry.debate} sensitivity={entry.sensitivity} />
          <SourceList ids={entry.sources} sources={catalog.sources} />
        </li>
      ))}
    </ol>
  );
}

export function KnowledgePage({ catalog }: { catalog: Catalog }) {
  return (
    <div className="page stack" data-page="knowledge">
      {catalog.content.knowledge.map((entry) => (
        <article key={entry.id} data-entry={entry.id} data-spotlight={entry.id === 'k3' ? 'languages' : undefined}>
          <ExampleFlag entry={entry} />
          <LabelBadge label={entry.label} />
          <ProtocolNotes entry={entry} />
          {entry.nation ? <InferenceLine value={entry.nation} /> : null}
          <p>{entry.text}</p>
          <Notes uncertainty={entry.uncertainty} debate={entry.debate} sensitivity={entry.sensitivity} />
          <SourceList ids={entry.sources} sources={catalog.sources} />
        </article>
      ))}
    </div>
  );
}

export function ReadingPage({ catalog }: { catalog: Catalog }) {
  return (
    <div className="page stack" data-page="reading">
      {catalog.content.further_reading.map((entry) => (
        <article key={entry.id} data-entry={entry.id}>
          <ExampleFlag entry={entry} />
          <ProtocolNotes entry={entry} />
          <LabelBadge label={entry.label} />
          <p>{entry.text}</p>
          <SourceList ids={entry.sources} sources={catalog.sources} />
        </article>
      ))}
    </div>
  );
}
