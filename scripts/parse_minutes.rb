#!/usr/bin/env ruby
# frozen_string_literal: true

# Parse OCR'd CIML minutes JSONs (GLM-OCR `md_results` shape) into
# Edoxen `Minutes` YAML files.
#
# Input:  reference-docs/ocr/raw/*.json
# Output: minutes/ciml-{N}-{lang}.yaml (one per language per meeting)
#
# Each input JSON is one OCR chunk (the GLM-OCR pipeline splits long
# PDFs into <=100-page windows). Multiple JSONs may cover the same
# (meeting, language); their sections are merged.
#
# The parser is intentionally permissive -- the source OCR is messy.
# It extracts:
#   * meeting ordinal (from cover-page heading)
#   * language (eng / fra)
#   * source_doc URL (when recorded in the JSON)
#   * sections: numbered agenda items with title + narrative markdown

require "json"
require "yaml"
require "fileutils"

ROOT = File.expand_path("..", __dir__)
RAW_DIR = File.join(ROOT, "reference-docs", "ocr", "raw")
OUT_DIR = File.join(ROOT, "minutes")

FileUtils.mkdir_p(OUT_DIR)

WORD_TO_INT = {
  "zeroth" => 0, "first" => 1, "second" => 2, "third" => 3,
  "fourth" => 4, "fifth" => 5, "sixth" => 6, "seventh" => 7,
  "eighth" => 8, "ninth" => 9, "tenth" => 10,
  "eleventh" => 11, "twelfth" => 12, "thirteenth" => 13,
  "fourteenth" => 14, "fifteenth" => 15, "sixteenth" => 16,
  "seventeenth" => 17, "eighteenth" => 18, "nineteenth" => 19,
  "twentieth" => 20,
}.freeze

EN_TENS = {
  "twenty" => 20, "thirty" => 30, "forty" => 40, "fifty" => 50,
  "sixty" => 60, "seventy" => 70, "eighty" => 80, "ninety" => 90,
}.freeze

FR_TENS = {
  "vingt" => 20, "trente" => 30, "quarante" => 40, "cinquante" => 50,
  "soixante" => 60, "septante" => 70, "huitante" => 80, "octante" => 80,
  "nonante" => 90,
}.freeze
FR_UNITS = {
  "et un" => 1, "deux" => 2, "trois" => 3, "quatre" => 4, "cinq" => 5,
  "six" => 6, "sept" => 7, "huit" => 8, "neuf" => 9, "dix" => 10,
  "onze" => 11, "douze" => 12, "treize" => 13, "quatorze" => 14,
  "quinze" => 15, "seize" => 16, "dix-sept" => 17, "dix-huit" => 18,
  "dix-neuf" => 19,
}.freeze

def parse_english_ordinal(phrase)
  parts = phrase.downcase.split(/[-\s]+/).map { |p| p.gsub(/[^a-z]/, "") }.reject(&:empty?)
  total = 0
  parts.each do |word|
    if EN_TENS.key?(word)
      total += EN_TENS[word]
    elsif WORD_TO_INT.key?(word)
      total += WORD_TO_INT[word]
    end
  end
  total.zero? ? nil : total
end

FR_UNIT_FULL_WORDS = {
  "premiere" => 1, "premier" => 1,
  "deuxieme" => 2, "troisieme" => 3, "quatrieme" => 4,
  "cinquieme" => 5, "sixieme" => 6, "septieme" => 7, "huitieme" => 8,
  "neuvieme" => 9, "dixieme" => 10, "onzieme" => 11, "douzieme" => 12,
  "treizieme" => 13, "quatorzieme" => 14, "quinzieme" => 15,
  "seizieme" => 16, "dixseptieme" => 17, "dixhuitieme" => 18,
  "dixneuvieme" => 19,
}.freeze

# Tens-prefix ordinals with the suffix elided/attached, e.g.
# "trentieme", "trentetroisieme", "quarantieme". We strip the trailing
# suffix and any compound unit, then map the bare tens word.
FR_TENS_PREFIX_FULL = {
  "vingt" => 20, "trent" => 30, "quarant" => 40, "cinquant" => 50,
  "soixant" => 60, "septant" => 70, "huitant" => 80, "octant" => 80,
  "nonant" => 90,
}.freeze

def parse_french_ordinal(phrase)
  # Normalise: lowercase, strip accents, drop punctuation. Result is
  # space-separated ASCII words. Hyphens become spaces so compound
  # ordinals ("vingt-neuvième") split cleanly.
  stripped = phrase.downcase.tr("-", " ").gsub(/[éèêë]/, "e").gsub(/[^a-z\s]/, "").strip
  words = stripped.split(/\s+/).reject { |w| w == "reunion" || w == "meeting" }
  first_word = words.first.to_s
  second_word = words[1].to_s

  # 1-19: direct full-word match on the first word.
  return FR_UNIT_FULL_WORDS[first_word] if FR_UNIT_FULL_WORDS.key?(first_word)

  # 20-99: tens prefix on first word (with optional "ieme" suffix),
  # optional unit on second word.
  FR_TENS_PREFIX_FULL.each do |prefix, base|
    next unless first_word.start_with?(prefix)
    rest = first_word[prefix.length..]
    # Strip trailing "e" (the full tens word ends in "e": "trente",
    # "quarante", ...). The bare stem ("trent") is what's left after
    # the prefix; the full word has an extra "e" we should ignore.
    rest = rest.sub(/\Ae\b/, "")
    # Strip ordinal suffix from rest if present.
    rest = rest.sub(/\A(?:ieme|eme|ime)\z/, "")

    if rest.empty?
      # First word was a bare tens stem (or tens+e). Look for a unit
      # on the second word — try the ordinal-stem table first (handles
      # "neuvième", "cinquième", "quatrième" which don't reduce to
      # bare cardinals by stripping "ieme"), then the bare-cardinal
      # table. Also handle the "et un" (21, 31, 41, ...) form where
      # the second word is "et" and the unit is on the third word.
      if second_word == "et" && words[2]
        third = words[2].sub(/(?:ieme|eme|ime)\z/, "")
        return base + 1 if third == "un" || words[2] == "un" || words[2] == "unieme"
      end
      if !second_word.empty?
        return base + FR_ORDINAL_UNIT_STEMS[second_word] if FR_ORDINAL_UNIT_STEMS.key?(second_word)
        u = second_word.sub(/(?:ieme|eme|ime)\z/, "")
        return base + FR_UNIT_FR_TO_INT[u] if FR_UNIT_FR_TO_INT.key?(u)
        return base + FR_UNIT_FR_TO_INT[second_word] if FR_UNIT_FR_TO_INT.key?(second_word)
      end
      return base
    end

    # Compound form: e.g. "trentetroisieme" → 30 + 3.
    if FR_UNIT_FR_TO_INT.key?(rest)
      return base + FR_UNIT_FR_TO_INT[rest]
    end
    rest_stripped = rest.sub(/ieme\z/, "")
    if FR_UNIT_FR_TO_INT.key?(rest_stripped)
      return base + FR_UNIT_FR_TO_INT[rest_stripped]
    end
  end

  nil
end

FR_UNIT_FR_TO_INT = {
  "un" => 1, "deux" => 2, "trois" => 3, "quatre" => 4, "cinq" => 5,
  "six" => 6, "sept" => 7, "huit" => 8, "neuf" => 9, "dix" => 10,
  "onze" => 11, "douze" => 12, "treize" => 13, "quatorze" => 14,
  "quinze" => 15, "seize" => 16,
}.freeze

# Ordinal-stem unit forms used in compound ordinals like "VINGT-NEUVIÈME"
# (29), "TRENTE-ET-UNIÈME" (31), "QUARANTE-CINQUIÈME" (45). Some of
# these stems differ from the bare cardinal (neuf → neuvième, cinq →
# cinquième, quatre → quatrième) so they need their own lookup.
FR_ORDINAL_UNIT_STEMS = {
  "unieme" => 1, "premiere" => 1, "premier" => 1,
  "deuxieme" => 2,
  "troisieme" => 3,
  "quatrieme" => 4,
  "cinquieme" => 5,
  "sixieme" => 6,
  "septieme" => 7,
  "huitieme" => 8,
  "neuvieme" => 9,
  "dixieme" => 10,
  "onzieme" => 11, "douzieme" => 12, "treizieme" => 13,
  "quatorzieme" => 14, "quinzieme" => 15, "seizieme" => 16,
  "dixseptieme" => 17, "dixhuitieme" => 18, "dixneuvieme" => 19,
}.freeze

def parse_arabic_ordinal(text)
  # Require a word boundary before the digit so "1.2 Meeting" doesn't
  # trigger — only "2 Meeting" / "2nd Meeting" / "12 Meeting" do.
  m = text.match(/(?:^|\s)(\d{1,2})(?:st|nd|rd|th)?\s+Meeting/i)
  m ? m[1].to_i : nil
end

EN_ORDINAL_RE = /
  (?:
    # 20-99: tens + optional unit
    (?:Twenty|Thirty|Forty|Fifty|Sixty|Seventy|Eighty|Ninety)
    (?:[-\s]*
       (?:First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|
        Tenth|Eleventh|Twelfth|Thirteenth|Fourteenth|Fifteenth|
        Sixteenth|Seventeenth|Eighteenth|Nineteenth|Twentieth)
    )?
    |
    # 1-19: unit alone
    (?:First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|
       Tenth|Eleventh|Twelfth|Thirteenth|Fourteenth|Fifteenth|
       Sixteenth|Seventeenth|Eighteenth|Nineteenth|Twentieth)
  )
  \s+(?:Meeting|CIML\ Meeting)
/ix

FR_ORDINAL_RE = %r{
  (?:
    # 20-99 form A: tens stem + bare unit + ordinal suffix
    # ("VINGT NEUF IÈME" — rare in source but possible).
    (?:Vingt|Trent|Quarant|Cinquant|Soixant|Septant|Huitant|Nonant)e?
    (?:[\s\-]+
       (?:et[\s\-]+un
        |deux|trois|quatre|cinq|six|sept|huit|neuf|dix
        |onze|douze|treize|quatorze|quinze|seize
        |dix[\s\-]+sept|dix[\s\-]+huit|dix[\s\-]+neuf)
    )?
    (?:ieme|ième|ème|eme|ime)
    |
    # 20-99 form B: tens stem + ordinal-suffixed unit (the unit already
    # carries the ième suffix, as in "VINGT-NEUVIÈME"). The unit
    # alternation enumerates both accented and unaccented forms because
    # Ruby's /i flag handles ASCII case folding but not accent removal.
    (?:Vingt|Trent|Quarant|Cinquant|Soixant|Septant|Huitant|Nonant)e?
    (?:[\s\-]+
       (?:unième|unieme|deuxième|deuxieme|troisième|troisieme|quatrième|quatrieme
        |cinquième|cinquieme|sixième|sixieme|septième|septieme|huitième|huitieme
        |neuvième|neuvieme|dixième|dixieme|onzième|onzieme|douzième|douzieme
        |treizième|treizieme|quatorzième|quatorzieme|quinzième|quinzieme
        |seizième|seizieme|dix-septième|dix-septieme|dix-huitième|dix-huitieme
        |dix-neuvième|dix-neuvieme)
    )
    |
    # 1-19: unit alone.
    (?:Premier|Première|Deuxième|Deuxieme|Troisième|Troisieme|Quatrième|Quatrieme|
       Cinquième|Cinquieme|Sixième|Sixieme|Septième|Septieme|Huitième|Huitieme|
       Neuvième|Neuvieme|Dixième|Dixieme|Onzième|Onzieme|Douzième|Douzieme|
       Treizième|Treizieme|Quatorzième|Quatorzieme|Quinzième|Quinzieme|
       Seizième|Seizieme|Dix-septi[eéè]me|Dix-septieme|Dix-huitième|Dix-huitieme|
       Dix-neuvième|Dix-neuvieme)
  )
  \s+(?:Réunion|Reunion|Meeting)
}ix

def detect_meeting_ordinal(md_head)
  if (m = md_head.match(EN_ORDINAL_RE))
    n = parse_english_ordinal(m[0])
    return n if n
  end
  if (m = md_head.match(FR_ORDINAL_RE))
    n = parse_french_ordinal(m[0])
    return n if n
  end
  parse_arabic_ordinal(md_head)
end

def detect_language(md_head)
  return "fra" if /COMPTE RENDU/i.match?(md_head)
  return "fra" if /R[ÉE]SUM[ÉE]/i.match?(md_head)
  return "fra" if /SOMMAIRE/i.match?(md_head)
  return "fra" if /R[ée]union/i.match?(md_head)
  return "fra" if /TRENT|VINGT|QUARANTE|CINQUANTE/i.match?(md_head)

  "eng"
end

def detect_source_url(data)
  data.dig("data_info", "source_url") || data["source_url"]
rescue StandardError
  nil
end

ROMAN_TO_INT = {
  "I" => 1, "II" => 2, "III" => 3, "IV" => 4, "V" => 5,
  "VI" => 6, "VII" => 7, "VIII" => 8, "IX" => 9, "X" => 10,
  "XI" => 11, "XII" => 12, "XIII" => 13, "XIV" => 14, "XV" => 15,
  "XVI" => 16, "XVII" => 17, "XVIII" => 18, "XIX" => 19, "XX" => 20,
}.freeze

def extract_sections(md)
  return [] if md.nil? || md.empty?

  lines = md.split("\n")
  sections = []
  current = nil

  # Match either Arabic (## N <title> or ## N.M <title>) or Roman
  # (## I — <title>, ## IV b — <title>, ...) section headers.
  # Separator may be punctuation (., -, em/en dash) OR whitespace —
  # some Bulletins use "## 1 ADOPTION DU COMPTE RENDU" with no
  # punctuation between number and title.
  header_re = /\A##\s+(\d{1,2}(?:\.\d{1,2})?(?:\.\d+)?(?:\s+[a-z])?|[IVX]+(?:\s+[a-z])?)\s*(?:[\.\-—–]\s*|\s+)(.*)\z/

  lines.each do |line|
    if (m = line.match(header_re))
      num = m[1].strip
      # Roman → Arabic for stable identifiers
      if ROMAN_TO_INT.key?(num)
        num = ROMAN_TO_INT[num].to_s
      end
      sections << current if current
      current = { "number" => num, "title" => m[2].strip, "narrative" => +"" }
    elsif current
      current["narrative"] << line << "\n"
    end
  end
  sections << current if current
  sections
end

by_meeting = Hash.new do |h, k|
  h[k] = { sources: [], sections: [] }
end

Dir.glob(File.join(RAW_DIR, "*.json")).sort.each do |path|
  data = JSON.parse(File.read(path))
  md = data["md_results"]
  md = md.is_a?(Array) ? md.join("\n") : md.to_s
  next if md.empty?
  next unless /MINUTES|COMPTE RENDU|MINUT[S]?|SUMMARY|R[ÉE]SUM[ÉE]|SOMMAIRE/i.match?(md[0..5000])

  head = md[0..5000]

  # Skip Conference minutes (they are OIML Conference, not CIML, and our
  # ciml-N-{lang} filename scheme doesn't apply). Detection: cover mentions
  # "International Conference on Legal Metrology" or "Conférence …
  # Métrologie Légale" AS THE DOCUMENT'S TITLE (not as a passing
  # reference). CIML minutes routinely mention "...co-located with the
  # Nth Conference..." in their narrative — that's not a Conference doc.
  # Only skip when no CIML ordinal can be detected.
  is_conf_doc = /International Conference on Legal Metrology|Conf[ée]rence Internationale de M[ée]trologie/i.match?(head)
  ciml_ord = detect_meeting_ordinal(head)
  next if is_conf_doc && ciml_ord.nil?

  ordinal = ciml_ord
  lang = detect_language(head)
  next unless ordinal

  key = [ordinal, lang]
  by_meeting[key][:sources] << detect_source_url(data)
  by_meeting[key][:sections].concat(extract_sections(md))
rescue JSON::ParserError
  next
end

written = []
by_meeting.each do |(ordinal, lang), info|
  next if info[:sections].empty?

  merged = {}
  info[:sections].each do |s|
    merged[s["number"]] ||= s
  end
  sections = merged.values.sort_by { |s| s["number"].split(".").map(&:to_i) }

  urn = "urn:oiml:ciml:minutes:ciml-#{ordinal}-#{lang}"
  # source_doc is optional in the schema — emit it only when at least
  # one of the contributing OCR chunks had a source_url. The original
  # PDFs may have been loaded directly into OCR (cache JSONs without
  # source_url) so we don't lose minutes coverage by skipping here.
  source_doc = info[:sources].compact.first

  data = {
    "identifier" => [{ "prefix" => "CIML", "number" => ordinal.to_s }],
    "urn" => urn,
    "language_code" => lang,
    "script" => "Latn",
    "sections" => sections,
  }
  data["source_doc"] = source_doc if source_doc

  out_path = File.join(OUT_DIR, "ciml-#{ordinal}-#{lang}.yaml")
  File.write(out_path, "---\n# Auto-generated by scripts/parse_minutes.rb.\n" +
                       data.to_yaml.sub(/^---\s*$/, "").lstrip)
  written << out_path
  puts "Wrote #{out_path} (#{sections.size} sections)"
end

puts "\n#{written.size} minutes files written."
