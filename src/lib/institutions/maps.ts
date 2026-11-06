export function openStreetMapLocation(
  latitude: number | null,
  longitude: number | null,
) {
  if (
    latitude === null ||
    longitude === null ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  )
    return null;
  const marker = `${latitude},${longitude}`;
  // Bound the viewport at the poles/antimeridian without changing the verified marker.
  const bbox = [
    Math.max(-180, longitude - 0.003),
    Math.max(-90, latitude - 0.002),
    Math.min(180, longitude + 0.003),
    Math.min(90, latitude + 0.002),
  ].join(',');
  const embed = new URL('https://www.openstreetmap.org/export/embed.html');
  embed.search = new URLSearchParams({
    bbox,
    layer: 'mapnik',
    marker,
  }).toString();
  const link = new URL('https://www.openstreetmap.org/');
  link.search = new URLSearchParams({
    mlat: String(latitude),
    mlon: String(longitude),
  }).toString();
  link.hash = `map=17/${latitude}/${longitude}`;
  return { embedUrl: embed.href, mapUrl: link.href };
}

export function openStreetMapSearch(address: string, city: string): string {
  const url = new URL('https://www.openstreetmap.org/search');
  url.search = new URLSearchParams({ query: `${address}, ${city}` }).toString();
  return url.href;
}
