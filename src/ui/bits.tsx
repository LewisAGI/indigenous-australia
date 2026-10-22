import { isUncheckedQuality } from '../data/publish';
import { forbidsDesigns, isExampleData, noPhotographyNote, splitInference, splitLabel } from '../data/present';
import type { Source } from '../data/schema';
import { Badge } from './Badge';

export function WarningCopy({ text, scope }: { text: string; scope: string }) {
  return (
    <p className="warning-copy" data-deceased-warning={scope}>
      {text}
    </p>
  );
}

export function ExampleFlag({ entry }: { entry: { example?: boolean; label?: string; text?: string; title?: string } }) {
  if (!isExampleData(entry)) return null;
  return <p className="example-flag">Example data</p>;
}

export function LabelBadge({ label }: { label: string }) {
  const split = splitLabel(label);
  return <Badge kind={split.kind} note={split.note} />;
}

export function ProtocolNotes({
  entry,
}: {
  entry: {
    id?: string;
    text?: string;
    title?: string;
    place?: string;
    sensitivity?: string;
    no_photography?: boolean;
    no_designs?: boolean;
  };
}) {
  const photo = noPhotographyNote(entry);
  const designs = forbidsDesigns(entry);
  if (!photo && !designs) return null;
  return (
    <>
      {photo ? (
        <p className="protocol" data-note="no-photography">
          {photo}
        </p>
      ) : null}
      {designs ? (
        <p className="protocol" data-note="no-designs">
          Do not reproduce the designs.
        </p>
      ) : null}
    </>
  );
}

export function Notes({
  uncertainty,
  debate,
  sensitivity,
}: {
  uncertainty?: string;
  debate?: string;
  sensitivity?: string;
}) {
  if (!uncertainty && !debate && !sensitivity) return null;
  return (
    <>
      {uncertainty ? (
        <p className="popup-note" data-uncertainty="">
          {uncertainty}
        </p>
      ) : null}
      {debate ? (
        <p className="popup-note" data-debate="">
          {debate}
        </p>
      ) : null}
      {sensitivity ? (
        <p className="popup-note" data-sensitivity="">
          {sensitivity}
        </p>
      ) : null}
    </>
  );
}

export function InferenceLine({ value }: { value: string }) {
  const split = splitInference(value);
  return (
    <p className="popup-note">
      {split.text}
      {split.inference ? <Badge kind="inference" note={split.inference} /> : null}
    </p>
  );
}

export function SourceList({ ids, sources }: { ids: string[]; sources: Source[] }) {
  return (
    <ul className="sources">
      {ids.map((id) => {
        const source = sources.find((item) => item.id === id);
        if (!source) return null;
        const unchecked = isUncheckedQuality(source.quality);
        return (
          <li key={id}>
            <a href={source.url} target="_blank" rel="noreferrer">
              {source.title}
            </a>
            <span>{source.author_org}</span>
            <span>Accessed {source.date_accessed}</span>
            {unchecked ? (
              <span className="badge badge-inference" data-source-quality="unchecked">
                Unchecked
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function AustlangList({ codes, sources }: { codes?: string[]; sources: Source[] }) {
  if (!codes || codes.length === 0) return null;
  return (
    <ul className="sources">
      {codes.map((code) => {
        const source = sources.find((item) => item.id === `austlang-${code.toLowerCase()}`);
        return (
          <li key={code}>
            {source ? (
              <a href={source.url} target="_blank" rel="noreferrer">
                AustLang {code}
              </a>
            ) : (
              <span>AustLang {code}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
