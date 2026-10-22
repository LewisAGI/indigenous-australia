import type { ReactNode } from 'react';

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  );
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function IconPlus() {
  return (
    <Svg>
      <path d="M12 5v14M5 12h14" {...stroke} />
    </Svg>
  );
}

export function IconMinus() {
  return (
    <Svg>
      <path d="M5 12h14" {...stroke} />
    </Svg>
  );
}

export function IconNations() {
  return (
    <Svg>
      <circle cx="12" cy="12" r="3" {...stroke} />
      <circle cx="12" cy="12" r="7.5" {...stroke} />
    </Svg>
  );
}

export function IconPlaces() {
  return (
    <Svg>
      <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z" {...stroke} />
      <circle cx="12" cy="11" r="1.6" fill="currentColor" />
    </Svg>
  );
}

export function IconStories() {
  return (
    <Svg>
      <path d="M6 5h9a3 3 0 0 1 3 3v11H9a3 3 0 0 0-3 3V5z" {...stroke} />
      <path d="M6 5a3 3 0 0 0-3 3v13" {...stroke} />
    </Svg>
  );
}

export function IconPeople() {
  return (
    <Svg>
      <circle cx="9" cy="9" r="2.2" {...stroke} />
      <circle cx="16" cy="10" r="1.7" {...stroke} />
      <path d="M4.5 18c.6-2.4 2.4-3.6 4.5-3.6S13.4 15.6 14 18" {...stroke} />
      <path d="M14 18c.3-1.6 1.4-2.6 3-2.6 1.2 0 2.2.6 2.7 1.8" {...stroke} />
    </Svg>
  );
}

export function IconTimeline() {
  return (
    <Svg>
      <path d="M6 6v12M6 8h8M6 12h5M6 16h9" {...stroke} />
    </Svg>
  );
}

export function IconKnowledge() {
  return (
    <Svg>
      <path d="M5 6.5h6.2A2.8 2.8 0 0 1 14 9.3V19H7.2A2.2 2.2 0 0 0 5 21.2V6.5z" {...stroke} />
      <path d="M19 6.5h-6.2A2.8 2.8 0 0 0 10 9.3V19h6.8A2.2 2.2 0 0 1 19 21.2V6.5z" {...stroke} />
    </Svg>
  );
}

export function IconReading() {
  return (
    <Svg>
      <path d="M8 6h10v12H8z" {...stroke} />
      <path d="M8 10H5m3 4H5m3 4H6" {...stroke} />
    </Svg>
  );
}

export function IconMap() {
  return (
    <Svg>
      <circle cx="12" cy="12" r="8" {...stroke} />
      <path d="M4 12h16M12 4c2.2 2.4 3.3 5 3.3 8S14.2 17.6 12 20c-2.2-2.4-3.3-5-3.3-8S9.8 6.4 12 4z" {...stroke} />
    </Svg>
  );
}

export function IconWhose() {
  return (
    <Svg>
      <path d="M14 5h5v5" {...stroke} />
      <path d="M19 5l-8 8" {...stroke} />
      <path d="M10 7H6v12h12v-4" {...stroke} />
    </Svg>
  );
}

export function IconWarning() {
  return (
    <Svg>
      <circle cx="12" cy="12" r="8" {...stroke} />
      <path d="M12 8v5" {...stroke} />
      <path d="M12 16.5h.01" {...stroke} />
    </Svg>
  );
}

export function IconRequest() {
  return (
    <Svg>
      <path d="M5 19l1.2-4.2L16.5 4.5a1.8 1.8 0 0 1 2.5 2.5L8.7 17.3 5 19z" {...stroke} />
    </Svg>
  );
}

export function IconPresent() {
  return (
    <Svg>
      <circle cx="12" cy="12" r="5" fill="currentColor" />
    </Svg>
  );
}

export function IconHistoric() {
  return (
    <Svg>
      <circle cx="12" cy="12" r="6" strokeDasharray="2.5 2.2" {...stroke} />
    </Svg>
  );
}

export function IconTorres() {
  return (
    <Svg>
      <circle cx="7" cy="14" r="1.4" fill="currentColor" />
      <circle cx="12" cy="10" r="1.4" fill="currentColor" />
      <circle cx="17" cy="14" r="1.4" fill="currentColor" />
    </Svg>
  );
}

export function IconAll() {
  return (
    <Svg>
      <rect x="4" y="4" width="6" height="6" {...stroke} />
      <rect x="14" y="4" width="6" height="6" {...stroke} />
      <rect x="4" y="14" width="6" height="6" {...stroke} />
      <rect x="14" y="14" width="6" height="6" {...stroke} />
    </Svg>
  );
}

export function IconBack() {
  return (
    <Svg>
      <path d="M15 6l-6 6 6 6" {...stroke} />
    </Svg>
  );
}

export function IconClose() {
  return (
    <Svg>
      <path d="M7 7l10 10M17 7L7 17" {...stroke} />
    </Svg>
  );
}
