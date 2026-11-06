import { selectSources } from '../src/lib/sources';
import { createMiramAdapter } from '../src/lib/ingestion/adapters/miram';
import { runIngestion } from '../src/lib/ingestion/run';
import { WranglerIngestionDatabase } from '../src/lib/db/wrangler-ingestion';

const args = process.argv.slice(2);
const sourceIndex = args.indexOf('--source');
if (sourceIndex !== -1 && !args[sourceIndex + 1])
  throw new Error('--source requires an approved source ID');
const selected = selectSources(
  sourceIndex === -1 ? undefined : args[sourceIndex + 1],
);
if (!args.includes('--live')) {
  console.info(
    'No requests made. After approval and Wrangler sign-in, use npm run ingest:production -- --live [--source approved-source-id] to update REMOTE D1.',
  );
} else {
  const db = new WranglerIngestionDatabase();
  let failed = false;
  for (const source of selected) {
    try {
      await runIngestion(db, createMiramAdapter(), source);
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      failed = true;
    }
  }
  if (failed) process.exitCode = 1;
}
