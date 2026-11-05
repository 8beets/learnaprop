import { santAndreu } from './sant-andreu';
import { canBaste } from './can-baste';

export const sources = [santAndreu, canBaste];

export function selectSources(sourceId?: string) {
  if (!sourceId) return sources;
  const source = sources.find((source) => source.id === sourceId);
  if (!source) throw new Error(`Unknown approved source: ${sourceId}`);
  return [source];
}
