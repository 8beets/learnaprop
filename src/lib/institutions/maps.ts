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
  const link = new URL('https://www.openstreetmap.org/');
  link.search = new URLSearchParams({
    mlat: String(latitude),
    mlon: String(longitude),
  }).toString();
  link.hash = `map=17/${latitude}/${longitude}`;
  return { mapUrl: link.href };
}

export function openStreetMapSearch(address: string, city: string): string {
  const url = new URL('https://www.openstreetmap.org/search');
  url.search = new URLSearchParams({ query: `${address}, ${city}` }).toString();
  return url.href;
}
