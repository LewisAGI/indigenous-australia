import { useEffect, useMemo, useRef, useState } from 'react';
import { loadCatalog } from '../data/load';
import type { PublicCatalog } from '../data/publish';
import { buildMarkers } from '../data/present';
import type { EraStatus } from '../data/schema';
import { createGlobe, type GlobeController } from '../globe/createGlobe';
import { IconButton } from './IconButton';
import { ReadingSheet } from './ReadingSheet';
import {
  IconClose,
  IconKnowledge,
  IconMap,
  IconMinus,
  IconNations,
  IconPeople,
  IconPlaces,
  IconPlus,
  IconReading,
  IconRequest,
  IconStories,
  IconTimeline,
  IconWarning,
  IconWhose,
} from './icons';
import { bindLongPress } from './longPress';
import {
  GroupDetail,
  KnowledgePage,
  NationsPage,
  PeoplePage,
  PlaceDetail,
  PlacesPage,
  ReadingPage,
  StoriesPage,
  TimelinePage,
  type Detail,
} from './views';

type View = 'nations' | 'places' | 'stories' | 'people' | 'timeline' | 'knowledge' | 'reading' | 'map';
type Menu = 'whose' | 'request' | null;

export function App() {
  const mapNode = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeController | null>(null);
  const selectRef = useRef<(id: string) => void>(() => {});
  const [catalog, setCatalog] = useState<PublicCatalog | null>(null);
  const [failed, setFailed] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [warningOpen, setWarningOpen] = useState(true);
  const [ackOpen, setAckOpen] = useState(true);
  const [view, setView] = useState<View>('nations');
  const [menu, setMenu] = useState<Menu>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [era, setEra] = useState<EraStatus>('present');
  const [torresOnly, setTorresOnly] = useState(false);
  const continueRef = useRef<HTMLButtonElement>(null);

  const markers = useMemo(() => (catalog ? buildMarkers(catalog.content) : []), [catalog]);
  const warning = catalog?.content.meta.deceased_persons_warning_default ?? '';
  const caveat = catalog?.content.meta.map_caveat ?? '';
  const aiatsis = catalog?.sources.find((source) => source.id === 'aiatsis-map');

  selectRef.current = (id) => {
    setView('places');
    setDetail({ type: 'place', id });
    setMenu(null);
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
  }, [catalog, mapReady, markers.length, view, warningOpen, era]);

  useEffect(() => {
    if (warningOpen) continueRef.current?.focus();
  }, [warningOpen]);

  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      const element = event.target instanceof Element ? event.target : null;
      if (!element || !menu) return;
      if (!element.closest('.popout, #whose-button, #request-button')) setMenu(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || warningOpen) return;
      if (menu) setMenu(null);
      else if (detail) setDetail(null);
      else setView('map');
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu, detail, warningOpen]);

  const openSection = (next: View) => {
    setMenu(null);
    setDetail(null);
    setView(next);
  };

  const showMap = (placeId?: string) => {
    setMenu(null);
    setView('map');
    setDetail(null);
    const point = markers.find((item) => item.placeId === placeId) ?? markers[0];
    if (point) globeRef.current?.flyTo(point.lon, point.lat);
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
            <IconButton label="Map" pressed={view === 'map'} onClick={() => showMap()}>
              <IconMap />
            </IconButton>
            <IconButton id="whose-button" label="Whose Country" expanded={menu === 'whose'} onClick={() => setMenu(menu === 'whose' ? null : 'whose')}>
              <IconWhose />
            </IconButton>
            <IconButton label="Deceased persons warning" pressed={warningOpen} onClick={() => setWarningOpen(true)}>
              <IconWarning />
            </IconButton>
            <IconButton id="request-button" label="Correction or takedown" expanded={menu === 'request'} onClick={() => setMenu(menu === 'request' ? null : 'request')}>
              <IconRequest />
            </IconButton>
          </div>
        </div>
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
          layoutKey={`${view}-${detail?.id ?? ''}-${ackOpen}-${menu ?? ''}`}
          onClose={() => openSection('map')}
          onBack={detail ? () => setDetail(null) : undefined}
        >
          <p className="boundary sheet-caveat" data-caveat="meta-sheet">
            {caveat}
          </p>
          {view === 'nations' && !detail ? (
            <NationsPage
              catalog={catalog}
              era={era}
              torresOnly={torresOnly}
              onEra={setEra}
              onTorres={setTorresOnly}
              onOpen={setDetail}
            />
          ) : null}
          {view === 'nations' && detail?.type === 'group' ? (
            <GroupDetail
              catalog={catalog}
              group={must(catalog.content.groups.find((item) => item.id === detail.id))}
              onOpen={(next) => {
                setDetail(next);
                if (next.type === 'place') setView('places');
                if (next.type === 'story') setView('stories');
              }}
            />
          ) : null}
          {view === 'places' && !detail ? <PlacesPage catalog={catalog} onMap={showMap} /> : null}
          {view === 'places' && detail?.type === 'place' ? (
            <PlaceDetail catalog={catalog} place={must(catalog.content.places.find((item) => item.id === detail.id))} />
          ) : null}
          {view === 'stories' ? <StoriesPage catalog={catalog} /> : null}
          {view === 'people' ? <PeoplePage catalog={catalog} /> : null}
          {view === 'timeline' ? <TimelinePage catalog={catalog} /> : null}
          {view === 'knowledge' ? <KnowledgePage catalog={catalog} /> : null}
          {view === 'reading' ? <ReadingPage catalog={catalog} /> : null}
        </ReadingSheet>
      ) : null}
      {failed ? <p className="gate-card">The knowledge pack did not load.</p> : null}
      {warningOpen && warning ? (
        <div className="gate" role="dialog" aria-modal="true" aria-labelledby="warning-title">
          <div className="gate-card">
            <h2 id="warning-title">Warning</h2>
            <p data-warning="deceased">{warning}</p>
            <p data-caveat="meta-dialog">{caveat}</p>
            <button ref={continueRef} type="button" className="gate-continue" onClick={() => setWarningOpen(false)}>
              Continue
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

function sheetLabel(view: View, detail: Detail | null): string {
  if (detail?.type === 'group') return 'Nation';
  if (detail?.type === 'place') return 'Place';
  if (view === 'nations') return 'Nations';
  if (view === 'places') return 'Places';
  if (view === 'stories') return 'Stories';
  if (view === 'people') return 'People';
  if (view === 'timeline') return 'Timeline';
  if (view === 'knowledge') return 'Knowledge';
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
      <button type="submit">Open a GitHub issue</button>
    </form>
  );
}
