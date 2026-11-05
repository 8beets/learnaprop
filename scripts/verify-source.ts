import { createMiramAdapter } from '../src/lib/ingestion/adapters/miram';
import { selectSources } from '../src/lib/sources';

const sourceId = process.argv[2];
for (const source of selectSources(sourceId)) {
  const records = await createMiramAdapter().fetchRecords(source);
  console.info(
    JSON.stringify(
      {
        source: source.id,
        verifiedAt: new Date().toISOString(),
        count: records.length,
        sample: records
          .slice(0, 3)
          .map(({ externalId, title, startDate, priceCents }) => ({
            externalId,
            title,
            startDate,
            priceCents,
          })),
      },
      null,
      2,
    ),
  );
}
