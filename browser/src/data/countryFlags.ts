// Country code → flag emoji helpers.
//
// The flag emoji is derived directly from the ISO 3166-1 alpha-2 code
// (no country-name lookups, no legacy string-form venues). Meeting and
// resolution YAMLs always carry `country_code` as the canonical
// identifier; the UI calls countryCodeToFlag(code) when rendering.

function countryCodeToEmoji(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
}

/** Returns the flag emoji for an ISO 3166-1 alpha-2 country code, or
 *  '' if the input is missing/empty. */
export function countryCodeToFlag(code: string | null | undefined): string {
  if (!code) return ''
  const c = code.toUpperCase().trim()
  if (c.length !== 2 || !/^[A-Z]{2}$/.test(c)) return ''
  return countryCodeToEmoji(c)
}
