import { parsePublicCatalog, type PublicCatalog } from './publish.ts';

export async function loadCatalog(): Promise<PublicCatalog> {
  const response = await fetch('/catalog.json');
  if (!response.ok) throw new Error('The knowledge pack did not load.');
  return parsePublicCatalog(await response.json());
}
