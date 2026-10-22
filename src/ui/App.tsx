import { useEffect, useMemo, useRef, useState } from 'react';
import { loadCatalog } from '../data/load';
import type { PublicCatalog } from '../data/publish';
import { buildMarkers, searchCatalog } from '../data/present';
import type { EraStatus } from '../data/schema';
import { createGlobe, type GlobeController } from '../globe/createGlobe';
import { IconButton } from './IconButton';
import { ReadingSheet } from './ReadingSheet';
import {
  IconAll,
  IconCheck,
  IconClose,
  IconCompare,
  IconFilter,
  IconGlossary,
  IconHistoric,
  IconKnowledge,
  IconMap,
  IconMinus,
  IconMore,
  IconNations,
  IconPeople,
  IconPlaces,
  IconPlus,
  IconPresent,
  IconReading,
  IconRequest,
  IconSearch,
  IconStories,
  IconTimeline,
  IconTorres,
  IconWarning,
  IconWhose,
} from './icons';
import { bindLongPress } from './longPress';
import {
  ComparePage,
  GlossaryPage,
  GroupDetail,
  KnowledgeDetail,
  KnowledgePage,
  NationsPage,
  PeoplePage,
  PersonDetail,
  PlaceDetail,
  PlacesPage,
  ReadingDetail,
  ReadingPage,
  StoriesPage,
  StoryDetail,
  TimelineDetail,
  TimelinePage,
  type Detail,
} from './views';

type View = 'nations' | 'places' | 'stories' | 'people' | 'timeline' | 'knowledge' | 'reading' | 'glossary' | 'compare' | 'map';
type Menu = 'whose' | 'request' | 'search' | 'filter' | 'more' | null;
interface Crumb {
  view: View;
  detail: Detail | null;
}

export function App() {
  const mapNode = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeController | null>(null);
  const selectRef = useRef<(id: string) => void>(() => {});
  const [catalog, setCatalog] = useState<PublicCatalog | null>(null);
  const [failed, setFailed] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [warningOpen, setWarningOpen] = useState(true);
  const [ackOpen, setAckOpen] = useState(true);
  const [menu, setMenu] = useState<Menu>(null);
  const [crumbs, setCrumbs] = useState<Crumb[]>([{ view: 'nations', detail: null }]);
  const [era, setEra] = useState<EraStatus>('present');
  const [torresOnly, setTorresOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const continueRef = useRef<HTMLButtonElement>(null);
  const current = crumbs[crumbs.length - 1] ?? { view: 'nations' as View, detail: null };
  const view = current.view;
  const detail = current.detail;

  const markers = useMemo(() => (catalog ? buildMarkers(catalog.content) : []), [catalog]);
  const hits = useMemo(() => (catalog ? searchCatalog(catalog.content, query) : []), [catalog, query]);
  const warning = catalog?.content.meta.deceased_persons_warning_default ?? '';
  const caveat = catalog?.content.meta.map_caveat ?? '';
  const aiatsis = catalog?.sources.find((source) => source.id === 'aiatsis-map');
  const filtersActive = era !== 'present' || torresOnly;

  selectRef.current = (id) => {
    setMenu(null);
    setCrumbs([{ view: 'places', detail: { type: 'place', id } }]);
  };

  useEffect(() => bindLongPress(), []);

  useEffect(() => {
    let cancel = false;
    loadCatalog()
      .then((result) => {
        if (!cancel) setCatalog(result);
      })
      .catch(() => {
        if (!cancel) setFailed(true);
      });
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    const node = mapNode.current;
    const root = document.querySelector<HTMLElement>('#app');
    if (!node || !root) return;
    const globe = createGlobe(node, root, () => {
      setMenu(null);
    });
    globeRef.current = globe;
    void globe.ready.then(() => setMapReady(true));
    return () => {
      globe.destroy();
      globeRef.current = null;
    };
  }, []);

  useEffect(() => {
    const selected = detail?.type === 'place' ? detail.id : null;
    globeRef.current?.setMarkers(markers, selected, (id) => selectRef.current(id));
  }, [markers, detail]);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('#app');
    if (!root) return;
    root.dataset.ready = catalog && mapReady ? 'true' : 'false';
    root.dataset.points = String(markers.length);
    root.dataset.view = view;
    root.dataset.warningOpen = warningOpen ? '1' : '0';
    root.dataset.era = era;
    root.dataset.torres = torresOnly ? '1' : '0';
  }, [catalog, mapReady, markers.length, view, warningOpen, era, torresOnly]);

  useEffect(() => {
    if (warningOpen) continueRef.current?.focus();
  }, [warningOpen]);

  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      const element = event.target instanceof Element ? event.target : null;
      if (!element || !menu) return;
      if (!element.closest('.popout, [data-menu-toggle]')) setMenu(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || warningOpen) return;
      if (menu) setMenu(null);
      else if (crumbs.length > 1) setCrumbs((stack) => stack.slice(0, -1));
      else setCrumbs([{ view: 'map', detail: null }]);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu, crumbs.length, warningOpen]);

  const openSection = (next: View) => {
    setMenu(null);
    setCrumbs([{ view: next, detail: null }]);
  };

  const openDetail = (next: Detail, stay?: View) => {
    setMenu(null);
    setCrumbs((stack) => [...stack, { view: stay ?? viewFor(next), detail: next }].slice(-8));
  };

  const showMap = (placeId?: string) => {
    setMenu(null);
    setCrumbs([{ view: 'map', detail: null }]);
    const point = markers.find((item) => item.placeId === placeId) ?? markers[0];
    if (point) globeRef.current?.flyTo(point.lon, point.lat);
  };

  const toggleCompare = (id: string) => {
    setCompareIds((currentIds) => {
      if (currentIds.includes(id)) return currentIds.filter((item) => item !== id);
      return [...currentIds, id].slice(-2);
    });
  };

  return (
    <>
      <div id="map" ref={mapNode} />
      <div className="chrome">
        <div className="chrome-row">
          <p className="wordmark">Indigenous Australia</p>
          <div className="tools">
            <IconButton label="Nations" pressed={view === 'nations'} onClick={() => openSection('nations')}>
              <IconNations />
            </IconButton>
            <IconButton label="Places" pressed={view === 'places'} onClick={() => openSection('places')}>
              <IconPlaces />
            </IconButton>
            <IconButton label="Stories" pressed={view === 'stories'} onClick={() => openSection('stories')}>
              <IconStories />
            </IconButton>
            <IconButton label="People" pressed={view === 'people'} onClick={() => openSection('people')}>
              <IconPeople />
            </IconButton>
            <IconButton label="Timeline" pressed={view === 'timeline'} onClick={() => openSection('timeline')}>
              <IconTimeline />
            </IconButton>
            <IconButton label="Knowledge" pressed={view === 'knowledge'} onClick={() => openSection('knowledge')}>
              <IconKnowledge />
            </IconButton>
            <IconButton label="Further reading" pressed={view === 'reading'} onClick={() => openSection('reading')}>
              <IconReading />
            </IconButton>
            <IconButton label="Glossary" pressed={view === 'glossary'} onClick={() => openSection('glossary')}>
              <IconGlossary />
            </IconButton>
            <IconButton label="Map" pressed={view === 'map'} onClick={() => showMap()}>
              <IconMap />
            </IconButton>
            <IconButton label="Deceased persons warning" pressed={warningOpen} onClick={() => setWarningOpen(true)}>
              <IconWarning />
            </IconButton>
            <IconButton id="more-button" menuToggle label="More" expanded={menu === 'more'} onClick={() => setMenu(menu === 'more' ? null : 'more')}>
              <IconMore />
            </IconButton>
          </div>
        </div>
        {menu === 'more' ? (
          <div className="popout icon-row" role="menu" aria-label="More">
            <IconButton label="Search" onClick={() => setMenu('search')}>
              <IconSearch />
            </IconButton>
            <IconButton label="Filters" pressed={filtersActive} onClick={() => setMenu('filter')}>
              <IconFilter />
            </IconButton>
            <IconButton label="Compare nations" pressed={view === 'compare'} onClick={() => openSection('compare')}>
              <IconCompare />
            </IconButton>
            <IconButton id="whose-button" menuToggle label="Whose Country" onClick={() => setMenu('whose')}>
              <IconWhose />
            </IconButton>
            <IconButton id="request-button" menuToggle label="Correction or takedown" onClick={() => setMenu('request')}>
              <IconRequest />
            </IconButton>
          </div>
        ) : null}
        {menu === 'search' ? (
          <form className="popout" role="search" aria-label="Search" onSubmit={(event) => event.preventDefault()}>
            <input aria-label="Search" value={query} onChange={(event) => setQuery(event.target.value)} />
            <div className="stack">
              {hits.map((hit) => (
                <button
                  key={`${hit.kind}-${hit.id}`}
                  type="button"
                  className="menu-item"
                  onClick={() => openDetail({ type: hit.kind, id: hit.id })}
                >
                  <span className="row-title">{hit.title}</span>
                </button>
              ))}
            </div>
          </form>
        ) : null}
        {menu === 'filter' ? (
          <div className="popout" role="dialog" aria-label="Filters">
            <div className="icon-row">
              <IconButton label="Present" pressed={era === 'present'} onClick={() => setEra('present')}>
                <IconPresent />
              </IconButton>
              <IconButton label="Historic" pressed={era === 'historic'} onClick={() => setEra('historic')}>
                <IconHistoric />
              </IconButton>
              <IconButton label="All nations" pressed={!torresOnly} onClick={() => setTorresOnly(false)}>
                <IconAll />
              </IconButton>
              <IconButton label="Torres Strait" pressed={torresOnly} onClick={() => setTorresOnly(true)}>
                <IconTorres />
              </IconButton>
            </div>
          </div>
        ) : null}
        {menu === 'whose' && aiatsis ? (
          <div className="popout" role="dialog" aria-label="Whose Country">
            <a href={aiatsis.url} target="_blank" rel="noreferrer">
              AIATSIS map of Indigenous Australia
            </a>
            <a href="https://www.nntt.gov.au/" target="_blank" rel="noreferrer">
              National Native Title Tribunal
            </a>
            <p data-protocol="no-boundaries">This site does not draw nation boundaries.</p>
          </div>
        ) : null}
        {menu === 'request' ? <RequestForm /> : null}
        {ackOpen ? (
          <div className="ack" data-acknowledgement="country">
            <p>We acknowledge Aboriginal and Torres Strait Islander peoples as the Traditional Custodians of the lands and waters of Australia, and pay respect to Elders past and present.</p>
            <IconButton label="Dismiss acknowledgement" onClick={() => setAckOpen(false)}>
              <IconClose />
            </IconButton>
          </div>
        ) : null}
      </div>
      <div className="zoom">
        <IconButton label="Zoom in" onClick={() => globeRef.current?.zoomIn()}>
          <IconPlus />
        </IconButton>
        <IconButton label="Zoom out" onClick={() => globeRef.current?.zoomOut()}>
          <IconMinus />
        </IconButton>
      </div>
      {caveat ? (
        <p className="caveat" data-caveat="meta">
          {caveat}{' '}
          {aiatsis ? (
            <a href={aiatsis.url} target="_blank" rel="noreferrer">
              AIATSIS map
            </a>
          ) : null}
        </p>
      ) : null}
      {catalog && view !== 'map' ? (
        <ReadingSheet
          label={sheetLabel(view, detail)}
          layoutKey={`${view}-${detail?.type ?? ''}-${detail?.id ?? ''}-${crumbs.length}-${ackOpen}-${menu ?? ''}-${era}-${torresOnly}`}
          onClose={() => openSection('map')}
          onBack={crumbs.length > 1 ? () => setCrumbs((stack) => stack.slice(0, -1)) : undefined}
        >
          {view === 'nations' && !detail ? <NationsPage catalog={catalog} era={era} torresOnly={torresOnly} onOpen={openDetail} /> : null}
          {detail?.type === 'group' ? (
            <GroupDetail catalog={catalog} group={must(catalog.content.groups.find((item) => item.id === detail.id))} onOpen={openDetail} />
          ) : null}
          {view === 'places' && !detail ? <PlacesPage catalog={catalog} torresOnly={torresOnly} onOpen={openDetail} /> : null}
          {detail?.type === 'place' ? (
            <PlaceDetail catalog={catalog} place={must(catalog.content.places.find((item) => item.id === detail.id))} onOpen={openDetail} onMap={showMap} />
          ) : null}
          {view === 'stories' && !detail ? <StoriesPage catalog={catalog} torresOnly={torresOnly} onOpen={openDetail} /> : null}
          {detail?.type === 'story' ? (
            <StoryDetail catalog={catalog} story={must(catalog.content.stories.find((item) => item.id === detail.id))} onOpen={openDetail} />
          ) : null}
          {view === 'people' && !detail ? <PeoplePage catalog={catalog} torresOnly={torresOnly} onOpen={openDetail} /> : null}
          {detail?.type === 'person' ? (
            <PersonDetail catalog={catalog} person={must(catalog.content.people.find((item) => item.id === detail.id))} onOpen={openDetail} />
          ) : null}
          {view === 'timeline' && !detail ? <TimelinePage catalog={catalog} torresOnly={torresOnly} onOpen={openDetail} /> : null}
          {detail?.type === 'timeline' ? (
            <TimelineDetail catalog={catalog} entry={must(catalog.content.timeline.find((item) => item.id === detail.id))} onOpen={openDetail} />
          ) : null}
          {view === 'knowledge' && !detail ? <KnowledgePage catalog={catalog} torresOnly={torresOnly} onOpen={openDetail} /> : null}
          {detail?.type === 'knowledge' ? (
            <KnowledgeDetail catalog={catalog} entry={must(catalog.content.knowledge.find((item) => item.id === detail.id))} onOpen={openDetail} />
          ) : null}
          {view === 'reading' && !detail ? <ReadingPage catalog={catalog} torresOnly={torresOnly} onOpen={openDetail} /> : null}
          {detail?.type === 'reading' ? <ReadingDetail catalog={catalog} entry={must(catalog.content.further_reading.find((item) => item.id === detail.id))} /> : null}
          {view === 'glossary' && !detail ? <GlossaryPage catalog={catalog} onOpen={(next) => openDetail(next, 'glossary')} /> : null}
          {view === 'compare' && !detail ? <ComparePage catalog={catalog} selected={compareIds} onToggle={toggleCompare} onOpen={openDetail} /> : null}
        </ReadingSheet>
      ) : null}
      {failed ? <p className="gate-card">The knowledge pack did not load.</p> : null}
      {warningOpen && warning ? (
        <div className="gate" role="dialog" aria-modal="true" aria-labelledby="warning-title">
          <div className="gate-card">
            <h2 id="warning-title">Warning</h2>
            <p data-warning="deceased">{warning}</p>
            <p data-caveat="meta-dialog">{caveat}</p>
            <button ref={continueRef} type="button" className="icon-button gate-continue" data-tip="Continue" title="Continue" aria-label="Continue" onClick={() => setWarningOpen(false)}>
              <IconCheck />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function must<T>(value: T | undefined): T {
  if (!value) throw new Error('Missing entry');
  return value;
}

function viewFor(detail: Detail): View {
  if (detail.type === 'group') return 'nations';
  if (detail.type === 'place') return 'places';
  if (detail.type === 'story') return 'stories';
  if (detail.type === 'person') return 'people';
  if (detail.type === 'timeline') return 'timeline';
  if (detail.type === 'knowledge') return 'knowledge';
  return 'reading';
}

function sheetLabel(view: View, detail: Detail | null): string {
  if (detail?.type === 'group') return 'Nation';
  if (detail?.type === 'place') return 'Place';
  if (detail?.type === 'story') return 'Story';
  if (detail?.type === 'person') return 'Person';
  if (detail?.type === 'timeline') return 'Timeline entry';
  if (detail?.type === 'knowledge') return 'Knowledge';
  if (detail?.type === 'reading') return 'Further reading';
  if (view === 'nations') return 'Nations';
  if (view === 'places') return 'Places';
  if (view === 'stories') return 'Stories';
  if (view === 'people') return 'People';
  if (view === 'timeline') return 'Timeline';
  if (view === 'knowledge') return 'Knowledge';
  if (view === 'glossary') return 'Glossary';
  if (view === 'compare') return 'Compare';
  return 'Further reading';
}

function RequestForm() {
  const [kind, setKind] = useState('correction');
  const [entry, setEntry] = useState('');
  const [message, setMessage] = useState('');
  return (
    <form
      className="popout request-form"
      role="dialog"
      aria-label="Correction or takedown"
      onSubmit={(event) => {
        event.preventDefault();
        const title = `${kind}: ${entry || 'indigenous-australia'}`;
        const url = `https://github.com/LewisAGI/indigenous-australia/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(message)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      }}
    >
      <select aria-label="Request type" value={kind} onChange={(event) => setKind(event.target.value)}>
        <option value="correction">Correction</option>
        <option value="takedown">Takedown</option>
        <option value="contribution">Contribution</option>
      </select>
      <input aria-label="Entry" value={entry} onChange={(event) => setEntry(event.target.value)} />
      <textarea aria-label="Message" required value={message} onChange={(event) => setMessage(event.target.value)} />
      <IconButton type="submit" label="Open a GitHub issue">
        <IconRequest />
      </IconButton>
    </form>
  );
}
