export function parsePage(params: URLSearchParams): number {
  const value = params.get('page') ?? '1';
  if (!/^\d{1,4}$/.test(value) || Number(value) < 1 || Number(value) > 1000)
    throw new Error('Invalid page');
  return Number(value);
}
