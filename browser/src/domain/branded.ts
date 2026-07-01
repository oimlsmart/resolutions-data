// Branded primitive types for domain value objects.
//
// A branded type is a nominal type that wraps a primitive (string,
// number) with a phantom marker. The marker exists only at compile
// time — at runtime a branded value is just the underlying primitive.
//
// The brand prevents accidental cross-passing: a function expecting
// a Doi won't accept a Urn, even though both are strings at runtime.
// Constructor functions (`asDoi`, `asUrn`, ...) validate at the
// system boundary (parse, fetch, user input) so invalid values
// surface immediately.
//
// See TODO.complete/23-architecture-improvements.md §1.

/**
 * Generic brand: combines an underlying type T with a phantom marker B.
 * The brand is encoded as `{ readonly __brand: B }` so the structural
 * type system treats two brands as distinct.
 */
export type Brand<T, B extends string> = T & { readonly __brand: B }

// --- Codes ----------------------------------------------------------

/** ISO 639-3 three-letter language code (eng, fra, deu, ...). */
export type Iso639Code = Brand<string, 'Iso639Code'>

/** ISO 3166-1 alpha-2 country code (US, FR, DE, ...). */
export type Iso3166Code = Brand<string, 'Iso3166Code'>

/** ISO 15924 four-letter script code (Latn, Cyrl, Hant, ...). */
export type Iso15924Code = Brand<string, 'Iso15924Code'>

/** IATA 3-letter city code (BER, PAR, CPT, ...). */
export type IataCityCode = Brand<string, 'IataCityCode'>

// --- Identifiers ----------------------------------------------------

/** DOI per ISO 26324 (e.g. `10.63493/resolutions/ciml202544`). */
export type Doi = Brand<string, 'Doi'>

/** URN per RFC 8141 (e.g. `urn:oiml:doc:ciml:resolution:2025-44`). */
export type Urn = Brand<string, 'Urn'>

/** Agenda item number (e.g. `1`, `11.2`, `16.3`). */
export type AgendaItemId = Brand<string, 'AgendaItemId'>

// --- Constructors with validation -----------------------------------

/**
 * Wrap a string as an ISO 639-3 code. Validates the 3-lowercase-letter
 * pattern. Throws on invalid input so the failure is loud at the
 * boundary rather than silent downstream.
 */
export function asIso639Code(s: string): Iso639Code {
  if (!/^[a-z]{3}$/.test(s)) {
    throw new Error(`Invalid ISO 639-3 code: ${JSON.stringify(s)}`)
  }
  return s as Iso639Code
}

/** Wrap a string as an ISO 3166-1 alpha-2 code. */
export function asIso3166Code(s: string): Iso3166Code {
  if (!/^[A-Z]{2}$/.test(s)) {
    throw new Error(`Invalid ISO 3166-1 alpha-2 code: ${JSON.stringify(s)}`)
  }
  return s as Iso3166Code
}

/** Wrap a string as an ISO 15924 script code. */
export function asIso15924Code(s: string): Iso15924Code {
  if (!/^[A-Z][a-z]{3}$/.test(s)) {
    throw new Error(`Invalid ISO 15924 script code: ${JSON.stringify(s)}`)
  }
  return s as Iso15924Code
}

/** Wrap a string as an IATA city code (3 uppercase letters). */
export function asIataCityCode(s: string): IataCityCode {
  if (!/^[A-Z]{3}$/.test(s)) {
    throw new Error(`Invalid IATA city code: ${JSON.stringify(s)}`)
  }
  return s as IataCityCode
}

/**
 * Wrap a string as a DOI. Validates the `10.<registrant>/<suffix>`
 * shape per ISO 26324. Tolerates DOIs without a scheme prefix; the
 * canonical form omits `https://doi.org/`.
 */
export function asDoi(s: string): Doi {
  const stripped = s.replace(/^https?:\/\/doi\.org\//i, '').replace(/^doi:/i, '')
  if (!/^10\.\d{4,9}\/\S+$/.test(stripped)) {
    throw new Error(`Invalid DOI: ${JSON.stringify(s)}`)
  }
  return stripped as Doi
}

/** Wrap a string as a URN per RFC 8141. */
export function asUrn(s: string): Urn {
  if (!/^urn:[a-z0-9][a-z0-9-]{0,31}:/i.test(s)) {
    throw new Error(`Invalid URN: ${JSON.stringify(s)}`)
  }
  return s as Urn
}

/** Wrap a string as an agenda item id. Tolerates dotted forms. */
export function asAgendaItemId(s: string): AgendaItemId {
  if (!/^\d+(\.\d+)*[a-z]?$/.test(s)) {
    throw new Error(`Invalid agenda item id: ${JSON.stringify(s)}`)
  }
  return s as AgendaItemId
}

// --- Safe parsers (return null instead of throwing) ----------------

/** Try to wrap a value; return null if invalid. Useful for filtering. */
export function tryAs<T extends string, B extends string>(
  s: string | undefined | null,
  validator: (s: string) => Brand<T, B>,
): Brand<T, B> | null {
  if (s == null) return null
  try {
    return validator(s)
  } catch {
    return null
  }
}
