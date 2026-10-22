import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { clearSheetChrome, placeSheet } from './sheetLayout';
import { IconBack, IconClose } from './icons';
import { IconButton } from './IconButton';

export function ReadingSheet({
  label,
  layoutKey,
  onClose,
  onBack,
  children,
}: {
  label: string;
  layoutKey: string;
  onClose: () => void;
  onBack?: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const place = () => placeSheet(node);
    place();
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('resize', place);
      clearSheetChrome();
    };
  }, [layoutKey]);
  return (
    <div ref={ref} className="event-sheet" role="dialog" aria-label={label} data-view={label}>
      <div className="sheet-tools">
        {onBack ? (
          <IconButton label="Back" onClick={onBack}>
            <IconBack />
          </IconButton>
        ) : (
          <span />
        )}
        <IconButton label="Close" onClick={onClose}>
          <IconClose />
        </IconButton>
      </div>
      <div className="sheet-body">{children}</div>
    </div>
  );
}
