/** Short public lines. Raw pack notes are never copied through. */
export const PUBLIC_PROTOCOL_LINES = [
  'Do not photograph',
  'Designs not reproduced',
  'Publicly shared by custodians',
  'Published with the Marika family for education',
] as const;

export type PublicProtocolLine = (typeof PUBLIC_PROTOCOL_LINES)[number];

export function isPublicProtocolLine(value: string): value is PublicProtocolLine {
  return (PUBLIC_PROTOCOL_LINES as readonly string[]).includes(value);
}

/** Only the fixed lines. Anything else is dropped. */
export function visibleProtocolLines(value?: string): PublicProtocolLine[] {
  if (!value) return [];
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(isPublicProtocolLine);
}

export function toPublicSensitivity(raw?: string): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  const existing = visibleProtocolLines(trimmed);
  if (existing.length > 0 && existing.join('\n') === trimmed) return existing.join('\n');
  const lines: PublicProtocolLine[] = [];
  if (/photograph|rock-art images/i.test(raw)) lines.push('Do not photograph');
  if (/do not (copy|reproduce)|not reproduce designs/i.test(raw)) lines.push('Designs not reproduced');
  if (/published for education with the marika family/i.test(raw)) lines.push('Published with the Marika family for education');
  else if (/publicly shared|community-published/i.test(raw)) lines.push('Publicly shared by custodians');
  const unique = PUBLIC_PROTOCOL_LINES.filter((line) => lines.includes(line));
  return unique.length > 0 ? unique.join('\n') : undefined;
}
