import { santAndreu } from './sant-andreu';
import { canBaste } from './can-baste';
import { patiLlimona } from './pati-llimona';

export const sources = [santAndreu, canBaste, patiLlimona];

export function selectSources(sourceId?: string) {
  if (!sourceId) return sources;
  const source = sources.find((source) => source.id === sourceId);
  if (!source) throw new Error(`Unknown approved source: ${sourceId}`);
  return [source];
}
