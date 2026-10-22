import { Map as MapLibreMap, Marker, setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import type { MapPoint } from '../data/present';
import { flyToPoint } from './camera';
import { mapStyle } from './style';

// Vite does not emit MapLibre's worker unless the URL is set. Without it the
// production build 404s and the land does not draw.
setWorkerUrl(workerUrl);

export interface GlobeController {
  map: MapLibreMap;
  ready: Promise<void>;
  setMarkers(points: MapPoint[], selectedId: string | null, onSelect: (id: string) => void): void;
  flyTo(lon: number, lat: number): void;
  zoomIn(): void;
  zoomOut(): void;
  destroy(): void;
}

export function createGlobe(container: HTMLElement, root: HTMLElement, onBackground: () => void): GlobeController {
  const map = new MapLibreMap({
    container,
    style: mapStyle(),
    center: [133.5, -26],
    zoom: container.clientWidth < 700 ? 2.35 : 3.15,
    minZoom: 0.8,
    maxZoom: 8,
    maxPitch: 0,
    pitchWithRotate: false,
    dragRotate: true,
    touchPitch: false,
    attributionControl: { compact: true, customAttribution: 'NASA Blue Marble · Natural Earth' },
    maplibreLogo: false,
    fadeDuration: 0,
  });

  let landRepainted = false;
  map.on('sourcedata', (event) => {
    if (landRepainted || event.sourceId !== 'land' || !event.isSourceLoaded) return;
    landRepainted = true;
    map.triggerRepaint();
    root.dataset.landRepaint = '1';
  });
  map.on('error', (event) => {
    const detail = event as { sourceId?: string; tile?: unknown };
    if (!detail.sourceId && !detail.tile) return;
    map.triggerRepaint();
    root.dataset.tileRepaint = '1';
  });

  const ready = new Promise<void>((resolve) => {
    let started = false;
    const setup = () => {
      if (started) return;
      started = true;
      map.setProjection({ type: 'globe' });
      root.dataset.projection = 'globe';
      map.setSky({
        'sky-color': '#070b12',
        'horizon-color': '#8ec5ff',
        'sky-horizon-blend': 0.36,
        'atmosphere-blend': 0.92,
      });
      resolve();
    };
    map.on('style.load', setup);
    if (map.isStyleLoaded()) setup();
  });

  const markers: Marker[] = [];
  let token = 0;
  window.__country = { map, points: [] };

  map.on('click', () => onBackground());
  const onResize = () => map.resize();
  window.addEventListener('resize', onResize);

  return {
    map,
    ready,
    setMarkers(points, selectedId, onSelect) {
      const current = ++token;
      void ready.then(() => {
        if (current !== token) return;
        markers.splice(0).forEach((marker) => marker.remove());
        points.forEach((point) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = point.id === selectedId ? 'pin is-selected' : 'pin';
          button.dataset.tip = point.label;
          button.dataset.status = point.status;
          button.title = point.label;
          button.setAttribute('aria-label', point.label);
          button.setAttribute('aria-pressed', point.id === selectedId ? 'true' : 'false');
          const halo = document.createElement('span');
          halo.className = 'halo';
          halo.setAttribute('aria-hidden', 'true');
          const dot = document.createElement('span');
          dot.className = 'dot';
          button.append(halo, dot);
          button.addEventListener('click', (event) => {
            event.stopPropagation();
            onSelect(point.id);
          });
          markers.push(new Marker({ element: button, anchor: 'center' }).setLngLat([point.lon, point.lat]).addTo(map));
        });
        window.__country = {
          map,
          points: points.map((point) => ({ id: point.id, lat: point.lat, lon: point.lon })),
        };
      });
    },
    flyTo(lon, lat) {
      void ready.then(() => flyToPoint(map, lon, lat));
    },
    zoomIn() {
      map.zoomIn({ duration: 200 });
    },
    zoomOut() {
      map.zoomOut({ duration: 200 });
    },
    destroy() {
      token += 1;
      markers.forEach((marker) => marker.remove());
      window.removeEventListener('resize', onResize);
      map.remove();
      delete window.__country;
    },
  };
}

declare global {
  interface Window {
    __country?: {
      map: MapLibreMap;
      points: { id: string; lat: number; lon: number }[];
    };
  }
}
