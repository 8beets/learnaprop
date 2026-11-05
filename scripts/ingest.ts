import { getPlatformProxy } from 'wrangler';
import { createMiramAdapter } from '../src/lib/ingestion/adapters/miram';
import { santAndreu } from '../src/lib/sources/sant-andreu';
import { runIngestion } from '../src/lib/ingestion/run';

if (process.argv.slice(2).join(' ') !== '--live') {
  console.info(
    'No network requests made. To fetch the approved public source into LOCAL D1, run npm run ingest:live. Apply npm run db:migrate first.',
  );
} else {
  const platform = await getPlatformProxy<Cloudflare.Env>({
    configPath: 'wrangler.jsonc',
    persist: { path: '.wrangler/state/v3' },
  });
  try {
    await runIngestion(platform.env.DB, createMiramAdapter(), santAndreu);
  } finally {
    await platform.dispose();
  }
}
