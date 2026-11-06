const months: Record<string, string> = {
  gener: '01',
  febrer: '02',
  març: '03',
  abril: '04',
  maig: '05',
  juny: '06',
  juliol: '07',
  agost: '08',
  setembre: '09',
  octubre: '10',
  novembre: '11',
  desembre: '12',
};

export function cleanText(value: string): string {
  return value.replace(/\s+/gu, ' ').trim();
}

export function localDate(
  day: string,
  month: string,
  year: string,
): string | null {
  const value = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.valueOf()) ||
    date.toISOString().slice(0, 10) !== value
    ? null
    : value;
}

export function parseDateRange(value: string): [string | null, string | null] {
  const dates = [
    ...value
      .toLowerCase()
      .matchAll(/(\d{1,2})\s+d[e’']\s*([\p{L}]+)\s+de\s+(\d{4})/gu),
  ].map((match) => localDate(match[1]!, months[match[2]!] ?? '00', match[3]!));
  if (
    /^\d{1,2}\s+d[e’']\s*[\p{L}]+\s+de\s+\d{4}$/u.test(value.trim()) &&
    dates.length === 1 &&
    dates[0]
  )
    return [dates[0], dates[0]];
  if (dates.length !== 2 || !dates[0] || !dates[1] || dates[0] > dates[1])
    return [null, null];
  return [dates[0], dates[1]];
}

// Only the explicitly labelled base price, never a discounted or materials price.
export function parseEuroPrice(value: string): number | null {
  if (/^Preu:\s*Gratuït\s*$/iu.test(cleanText(value))) return 0;
  const match = /^Preu:\s*(\d+(?:\.\d{3})*),(\d{2})\s*€/u.exec(
    cleanText(value),
  );
  if (!match) return null;
  const cents = Number(match[1]!.replaceAll('.', '')) * 100 + Number(match[2]);
  return Number.isSafeInteger(cents) ? cents : null;
}

export async function hash(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(bytes)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
