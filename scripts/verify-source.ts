import { createMiramAdapter } from '../src/lib/ingestion/adapters/miram';
import { santAndreu } from '../src/lib/sources/sant-andreu';

const records = await createMiramAdapter().fetchRecords(santAndreu);
console.info(
  JSON.stringify(
    {
      source: santAndreu.id,
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
