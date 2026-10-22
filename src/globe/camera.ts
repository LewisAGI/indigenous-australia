import type { Map as MapLibreMap } from 'maplibre-gl';

/** Padding keeps the title, the caveat, and an open sheet off the framed point. */
export function flyToPoint(map: MapLibreMap, lon: number, lat: number): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  map.easeTo({
    center: [lon, lat],
    zoom: Math.min(4.6, Math.max(map.getZoom(), 3.5)),
    padding: framePadding(),
    duration: reduced ? 0 : 700,
  });
}

export function framePadding(): { top: number; bottom: number; left: number; right: number } {
  const chrome = visible('.chrome');
  const caveat = visible('.caveat');
  const zoom = visible('.zoom');
  const sheet = document.querySelector<HTMLElement>('.event-sheet');
  const sheetBox = sheet ? visible('.event-sheet') : null;
  const top = Math.max(56, (chrome?.bottom ?? 48) + 12);
  const right = (zoom?.width ?? 44) + 28;
  const bottom = caveat ? Math.max(24, window.innerHeight - caveat.top + 12) : 100;
  const sideSheet = sheetBox && sheet?.dataset.placement === 'side' && sheetBox.width > 40;
  return {
    top,
    left: sideSheet && sheetBox ? sheetBox.right + 16 : 28,
    right,
    bottom,
  };
}

function visible(selector: string): DOMRect | null {
  const element = document.querySelector(selector);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return null;
  return rect;
}
