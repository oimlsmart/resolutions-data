// usePdfUrl — a thin helper that returns the canonical OIML URL for a
// source PDF, falling back to the per-meeting/index page when the
// canonical PDF isn't on the flat /pdf/ path.
//
// The PDF URLs come from scripts/manifest.yaml and are baked into the
// JSON mirror at build time (see scripts/build-data.mjs → `source_url`).
// Composable shape keeps the call site symmetric with useDateFormat etc.

export function getPdfUrl(sourceUrl: string | undefined | null): string | '' {
  if (!sourceUrl) return ''
  return sourceUrl
}
