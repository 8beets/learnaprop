import { getPlatformProxy } from 'wrangler';
import { createMiramAdapter } from '../src/lib/ingestion/adapters/miram';
import { selectSources } from '../src/lib/sources';
import { runIngestion } from '../src/lib/ingestion/run';

const args = process.argv.slice(2);
const sourceIndex = args.indexOf('--source');
const selected = selectSources(
  sourceIndex === -1 ? undefined : args[sourceIndex + 1],
);
if (sourceIndex !== -1 && !args[sourceIndex + 1])
  throw new Error('--source requires an approved source ID');
if (!args.includes('--live')) {
  console.info(
    'No network requests made. To fetch the approved public source into LOCAL D1, run npm run ingest:live. Apply npm run db:migrate first.',
  );
} else {
  const platform = await getPlatformProxy<Cloudflare.Env>({
    configPath: 'wrangler.jsonc',
    persist: { path: '.wrangler/state/v3' },
    remoteBindings: false,
  });
  try {
    let failed = false;
    for (const source of selected) {
      try {
        await runIngestion(platform.env.DB, createMiramAdapter(), source);
      } catch {
        failed = true;
      }
    }
    if (failed) process.exitCode = 1;
  } finally {
    await platform.dispose();
  }
}
