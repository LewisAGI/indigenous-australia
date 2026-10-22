/** Portrait uses the bottom sheet. Wider screens use a side sheet so the list stays primary. */
export function placeSheet(sheet: HTMLElement): void {
  const portrait = window.innerHeight > window.innerWidth;
  const chrome = visible('.chrome');
  const caveat = visible('.caveat');
  const top = Math.round((chrome?.bottom ?? 72) + 8);
  const limit = Math.round((caveat?.top ?? window.innerHeight - 12) - 8);
  sheet.dataset.placement = portrait ? 'bottom' : 'side';
  if (!portrait) {
    const width = Math.min(480, Math.max(300, Math.floor(window.innerWidth * 0.42)));
    const height = Math.max(160, limit - top);
    sheet.style.left = '12px';
    sheet.style.right = 'auto';
    sheet.style.top = `${top}px`;
    sheet.style.bottom = 'auto';
    sheet.style.width = `${width}px`;
    sheet.style.maxWidth = `${width}px`;
    sheet.style.height = `${height}px`;
    sheet.style.maxHeight = `${height}px`;
    raiseZoom(sheet);
    return;
  }
  const bottom = Math.max(12, window.innerHeight - limit);
  const available = window.innerHeight - bottom - top;
  const maxHeight = Math.max(180, Math.min(available, Math.round(window.innerHeight * 0.7)));
  sheet.style.left = '12px';
  sheet.style.right = '12px';
  sheet.style.top = 'auto';
  sheet.style.bottom = `${bottom}px`;
  sheet.style.width = 'auto';
  sheet.style.maxWidth = 'none';
  sheet.style.height = `${Math.floor(maxHeight)}px`;
  sheet.style.maxHeight = `${Math.floor(maxHeight)}px`;
  raiseZoom(sheet);
}

export function clearSheetChrome(): void {
  const zoomEl = document.querySelector<HTMLElement>('.zoom');
  if (!zoomEl) return;
  zoomEl.classList.remove('is-raised', 'is-hidden');
  zoomEl.style.top = '';
  zoomEl.style.bottom = '';
  zoomEl.style.transform = '';
}

function raiseZoom(sheet: HTMLElement): void {
  const zoomEl = document.querySelector<HTMLElement>('.zoom');
  const sheetBox = sheet.getBoundingClientRect();
  if (!zoomEl || sheetBox.height < 2) return;
  const zoom = zoomEl.getBoundingClientRect();
  const overlaps = zoom.top < sheetBox.bottom - 1 && zoom.bottom > sheetBox.top - 1 && zoom.height > 2;
  if (!overlaps) {
    zoomEl.classList.remove('is-raised', 'is-hidden');
    zoomEl.style.top = '';
    zoomEl.style.bottom = '';
    zoomEl.style.transform = '';
    return;
  }
  const wordmark = document.querySelector('.wordmark')?.getBoundingClientRect();
  const topLimit = (wordmark && wordmark.height > 2 ? wordmark.bottom : 40) + 8;
  const nextTop = sheetBox.top - 8 - zoom.height;
  if (nextTop < topLimit) {
    zoomEl.classList.add('is-hidden');
    zoomEl.classList.remove('is-raised');
    zoomEl.style.transform = 'none';
    zoomEl.style.top = '-200px';
    zoomEl.style.bottom = 'auto';
    return;
  }
  zoomEl.classList.remove('is-hidden');
  zoomEl.classList.add('is-raised');
  zoomEl.style.transform = 'none';
  zoomEl.style.top = `${Math.round(nextTop)}px`;
  zoomEl.style.bottom = 'auto';
}

function visible(selector: string): DOMRect | null {
  const element = document.querySelector(selector);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return null;
  return rect;
}
