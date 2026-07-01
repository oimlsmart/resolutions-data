#!/usr/bin/env ruby
# frozen_string_literal: true

# Parse OCR'd CIML minutes JSONs (GLM-OCR `md_results` shape) into
# Edoxen `Minutes` YAML files.
#
# Input:  reference-docs/.ocr/raw/*.json
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
RAW_DIR = File.join(ROOT, "reference-docs", ".ocr", "raw")
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

def parse_french_ordinal(phrase)
  cleaned = phrase.downcase
  cleaned = cleaned.sub(/(ieme|ième|ème|eme|ere|er)\b/i, "")
  cleaned = cleaned.tr("-", " ")
  parts = cleaned.split(/\s+/).map { |p| p.gsub(/[^a-z]/, "") }.reject(&:empty?)
  total = 0
  i = 0
  while i < parts.length
    p = parts[i]
    if FR_TENS.key?(p)
      total += FR_TENS[p]
      # lookahead for "et un"
      if parts[i + 1] == "et" && parts[i + 2] == "un"
        total += 1
        i += 2
      elsif FR_UNITS.key?(parts[(i + 1)..].join(" "))
        total += FR_UNITS[parts[(i + 1)..].join(" ")]
        i += 1
      elsif FR_UNITS.key?(parts[i + 1])
        total += FR_UNITS[parts[i + 1]]
        i += 1
      end
    elsif FR_UNITS.key?(p)
      total += FR_UNITS[p]
    elsif WORD_TO_INT.key?(p)
      total += WORD_TO_INT[p]
    end
    i += 1
  end
  total.zero? ? nil : total
end

def parse_arabic_ordinal(text)
  m = text.match(/(\d{1,2})(?:st|nd|rd|th)?\s+Meeting/i)
  m ? m[1].to_i : nil
end

EN_ORDINAL_RE = /
  (?:Twenty|Thirty|Forty|Fifty|Sixty|Seventy|Eighty|Ninety)
  (?:[-\s]*
     (?:First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|
      Tenth|Eleventh|Twelfth|Thirteenth|Fourteenth|Fifteenth|
      Sixteenth|Seventeenth|Eighteenth|Nineteenth|Twentieth)
  )?
  \s+(?:Meeting|CIML\ Meeting)
/ix

FR_ORDINAL_RE = /
  (?:Vingt|Trente|Quarante|Cinquante|Soixante|Septante|Huitante|Nonante)
  (?:[-\s]*
     (?:et\ un|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|
      onze|douze|treize|quatorze|quinze|seize|dix-sept|dix-huit|dix-neuf)
  )?
  [eè]?(?:me|me|ième|ème)?
  \s+(?:Réunion|Meeting)
/ix

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
  return "fra" if /Réunion/i.match?(md_head)
  return "fra" if /TRENT|VINGT|QUARANTE|CINQUANTE/i.match?(md_head)

  "eng"
end

def detect_source_url(data)
  data.dig("data_info", "source_url") || data["source_url"]
rescue StandardError
  nil
end

def extract_sections(md)
  return [] if md.nil? || md.empty?

  lines = md.split("\n")
  sections = []
  current = nil

  lines.each do |line|
    if (m = line.match(/^###?\s+(\d{1,2}(?:\.\d{1,2})?)\s+(.+)$/))
      sections << current if current
      current = { "number" => m[1], "title" => m[2].strip, "narrative" => +"" }
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
  next unless /MINUTES|COMPTE RENDU/i.match?(md[0..5000])

  head = md[0..5000]
  ordinal = detect_meeting_ordinal(head)
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
  source_doc = info[:sources].compact.first

  data = {
    "identifier" => [{ "prefix" => "CIML", "number" => ordinal.to_s }],
    "urn" => urn,
    "language_code" => lang,
    "script" => "Latn",
    "source_doc" => source_doc,
    "sections" => sections,
  }

  out_path = File.join(OUT_DIR, "ciml-#{ordinal}-#{lang}.yaml")
  File.write(out_path, "---\n# Auto-generated by scripts/parse_minutes.rb.\n" +
                       data.to_yaml.sub(/^---\s*$/, "").lstrip)
  written << out_path
  puts "Wrote #{out_path} (#{sections.size} sections)"
end

puts "\n#{written.size} minutes files written."
