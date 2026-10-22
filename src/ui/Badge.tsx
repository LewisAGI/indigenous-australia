import type { BadgeKind } from '../data/schema';

const NAMES: Record<BadgeKind, string> = {
  evidence: 'Evidence',
  inference: 'Inference',
  'abstract-only': 'Abstract only',
};

export function Badge({ kind, note }: { kind: BadgeKind; note?: string }) {
  return (
    <span className={`badge badge-${kind}`} data-badge={kind}>
      <span className="badge-name">{NAMES[kind]}</span>
      {note ? <span className="badge-note">{note}</span> : null}
    </span>
  );
}

export function PermissionBadge({ status }: { status: string }) {
  const label = status === 'link-only' ? 'Link only' : status === 'summary-with-credit' ? 'Summary with credit' : 'Pending review';
  return (
    <span className="badge badge-permission" data-permission={status}>
      {label}
    </span>
  );
}
