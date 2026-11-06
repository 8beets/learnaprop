import { describe, expect, it } from 'vitest';
import {
  centreProfile,
  centreProfileSchema,
  verifiedCentreProfiles,
} from '../../src/lib/institutions/profiles';
import {
  openStreetMapLocation,
  openStreetMapSearch,
} from '../../src/lib/institutions/maps';

describe('verified centre locations', () => {
  it('validates all 11 profiles with unique stable slugs and municipal provenance', () => {
    const profiles = Object.values(verifiedCentreProfiles).map((p) =>
      centreProfileSchema.parse(p),
    );
    expect(profiles).toHaveLength(11);
    expect(new Set(profiles.map((p) => p.slug)).size).toBe(11);
    for (const profile of profiles) {
      expect(profile.location?.sourceUrl).toMatch(
        /^https:\/\/guia.barcelona.cat\/ca\/detall\//,
      );
      expect(profile.location?.verifiedAt).toBe('2026-11-06');
    }
    expect(centreProfile('cc-unknown')).toEqual({ slug: 'unknown' });
    expect(centreProfile('fab-casa-del-mig').notice).toBe('temporary_closure');
  });
  it('embeds the exact verified marker and a bounded viewport', () => {
    const map = openStreetMapLocation(41.43088018380354, 2.1894124386376466)!;
    const embed = new URL(map.embedUrl);
    expect(embed.origin + embed.pathname).toBe(
      'https://www.openstreetmap.org/export/embed.html',
    );
    expect(embed.searchParams.get('marker')).toBe(
      '41.43088018380354,2.1894124386376466',
    );
    const bounds = embed.searchParams.get('bbox')!.split(',').map(Number);
    expect(bounds[0]).toBeLessThan(2.1894124386376466);
    expect(bounds[2]).toBeGreaterThan(2.1894124386376466);
    expect(new URL(map.mapUrl).searchParams.get('mlat')).toBe(
      '41.43088018380354',
    );
  });
  it('keeps missing and invalid coordinates unknown', () => {
    for (const [lat, lon] of [
      [null, null],
      [41, null],
      [null, 2],
      [91, 2],
      [41, 181],
      [NaN, 2],
      [41, Infinity],
    ] as const)
      expect(openStreetMapLocation(lat, lon)).toBeNull();
    expect(
      centreProfileSchema.safeParse({
        slug: 'test',
        location: { latitude: 41, longitude: 2 },
      }).success,
    ).toBe(false);
    expect(
      centreProfileSchema.safeParse({
        slug: 'test',
        location: {
          latitude: 91,
          longitude: 2,
          sourceUrl: 'https://example.org',
          verifiedAt: '2026-11-06',
        },
      }).success,
    ).toBe(false);
    expect(
      new URL(
        openStreetMapSearch('Carrer & plaça 2', 'Barcelona'),
      ).searchParams.get('query'),
    ).toBe('Carrer & plaça 2, Barcelona');
  });
});
