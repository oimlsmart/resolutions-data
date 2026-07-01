#!/usr/bin/env ruby
# frozen_string_literal: true

# Generates edoxen-Meeting-shape YAML files from scripts/manifest.yaml.
#
# One meeting YAML per (kind, ordinal) — the manifest carries per-language
# entries, this script folds them into a single multi-localization
# document keyed by the meeting's stable identifier.
#
# Output: meetings/ciml-{N}.yaml and meetings/conference-{N}.yaml.
# Re-running is idempotent (existing files are overwritten in place).
#
# Usage:
#   bundle exec ruby scripts/generate_meetings.rb
#
# The generated YAML is conformant with the canonical Edoxen Meeting
# schema (edoxen-model/models/meeting.lutaml). Each file is consumed
# by the browser via the Ruby edoxen gem:
#
#   bundle exec edoxen validate-meetings meetings/ciml-56.yaml

require "yaml"
require "date"

ROOT = File.expand_path("..", __dir__)
MANIFEST_PATH = File.join(ROOT, "scripts", "manifest.yaml")
OUT_DIR = File.join(ROOT, "meetings")
SCHEMA_REF = "https://github.com/edoxen/edoxen-schema/meeting.yaml"

abort "manifest missing: #{MANIFEST_PATH}" unless File.exist?(MANIFEST_PATH)
require "fileutils"
FileUtils.mkdir_p(OUT_DIR)

raw = YAML.safe_load(File.read(MANIFEST_PATH))
sources = raw.fetch("sources")

# Group: (kind, ordinal) → { meta: {...}, languages: {...} }
def key_for(entry)
  kind = entry.fetch("kind")
  if kind == "ciml"
    ["ciml", entry.fetch("meeting").to_i]
  elsif kind == "conference"
    ["conference", entry.fetch("session").to_i]
  else
    raise "unknown kind: #{kind.inspect}"
  end
end

meetings = {}
sources.each do |entry|
  k = key_for(entry)
  m = (meetings[k] ||= { meta: {}, languages: {}, urls: {} })
  m[:meta].merge!(entry.slice("city", "country_code", "venue", "year", "doc_kind").compact)
  m[:meta]["date_start"] ||= entry["date_start"]
  m[:meta]["date_end"]   ||= entry["date_end"]

  lang = entry["lang"]
  m[:languages][lang] = {
    "title" => entry["title"],
  }

  url = entry["url"]
  next unless url

  kind_short = k[0]
  ord = k[1]
  m[:urls][lang] = url
  m[:meta]["venue"] ||= entry["venue"]
end

ORDINAL_WORDS = %w[zeroth first second third fourth fifth sixth seventh eighth ninth tenth].freeze
def ordinal_word(n)
  return "" if n.zero?
  ones = n % 10
  tens = (n % 100) / 10
  suffix = if tens == 1 then "th"
           elsif ones == 1 then "st"
           elsif ones == 2 then "nd"
           elsif ones == 3 then "rd"
           else "th"
           end
  "#{n}#{suffix}"
end

def meeting_urn(kind, ord)
  if kind == "ciml"
    "urn:oiml:ciml:meeting:ciml-#{ord}"
  else
    "urn:oiml:conference:meeting:conference-#{ord}"
  end
end

def meeting_slug(kind, ord)
  "#{kind}-#{ord}"
end

def meeting_type(kind)
  case kind
  when "ciml" then "plenary"
  when "conference" then "conference_session"
  else "plenary"
  end
end

def committee_label(kind)
  case kind
  when "ciml" then "International Committee of Legal Metrology (CIML)"
  when "conference" then "International Conference of Legal Metrology"
  else ""
  end
end

def identifiers_for(kind, ord)
  case kind
  when "ciml" then [{ "prefix" => "CIML", "number" => ord.to_s }]
  when "conference" then [{ "prefix" => "OIML Conference", "number" => ord.to_s }]
  else []
  end
end

def locale_label(kind, ord, lang)
  # English-original + ordinal.
  if kind == "ciml"
    return "#{ordinal_word(ord)} CIML Meeting" if lang == "eng"
    return "#{ordinal_word(ord)} réunion du CIML" if lang == "fra"
  else
    return "#{ordinal_word(ord)} OIML Conference" if lang == "eng"
    return "#{ordinal_word(ord)} Conférence OIML" if lang == "fra"
  end
  ""
end

def meeting_year(date_start)
  return nil unless date_start

  Date.parse(date_start).year
rescue ArgumentError
  nil
end

# Map from manifest city name + ISO 3166-1 alpha-2 country code to the
# 5-character UN/LOCODE. Cover the cities OIML/CIML has actually met
# in (per scripts/manifest.yaml). Returns nil for virtual meetings or
# when no mapping is known — the schema's `city` field is optional.
CITY_NAME_TO_UNLOCODE = {
  ["Berlin", "DE"]             => "DEBER",
  ["Lyon", "FR"]               => "FRLYS",
  ["Cape Town", "ZA"]          => "ZACPT",
  ["Shanghai", "CN"]           => "CNSHA",
  ["Sydney", "AU"]             => "AUSYD",
  ["Mombasa", "KE"]            => "KEMBA",
  ["Orlando", "US"]            => "USORL",
  ["Prague", "CZ"]             => "CZPRG",
  ["Bucharest", "RO"]          => "ROBUH",
  ["Ho Chi Minh City", "VN"]   => "VNSGN",
  ["Auckland", "NZ"]           => "NZAKL",
  ["Arcachon", "FR"]           => "FRARC",
  ["Strasbourg", "FR"]         => "FRSTR",
  ["Cartagena de Indias", "CO"] => "COCTG",
  ["Hamburg", "DE"]            => "DEHAM",
  ["Bratislava", "SK"]         => "SKBTS",
  ["Chiang Mai", "TH"]         => "THCNM",
  ["Paris", "FR"]              => "FRPAR",
  ["Berlin, Germany", "DE"]    => "DEBER",
  ["Lyon, France", "FR"]       => "FRLYS",
  ["Cape Town, South Africa", "ZA"] => "ZACPT",
  ["Shanghai, P.R. China", "CN"]    => "CNSHA",
  ["Sydney, Australia", "AU"]       => "AUSYD",
  ["Mombasa, Kenya", "KE"]          => "KEMBA",
  ["Orlando, USA", "US"]            => "USORL",
  ["Prague, Czech Republic", "CZ"]  => "CZPRG",
  ["Bucharest, Romania", "RO"]      => "ROBUH",
  ["Ho Chi Minh City, Viet Nam", "VN"] => "VNSGN",
  ["Arcachon, France", "FR"]        => "FRARC",
  ["Strasbourg, France", "FR"]      => "FRSTR",
  ["Cartagena de Indias, Colombia", "CO"] => "COCTG",
  ["Hamburg, Germany", "DE"]        => "DEHAM",
  ["Bratislava, Slovak Republic", "SK"] => "SKBTS",
  ["Chiang Mai, Thailand", "TH"]    => "THCNM",
  ["Paris, France", "FR"]           => "FRPAR",
}.freeze

def unlocode_for(city_name, country_code)
  return nil if city_name.nil? || city_name.empty?
  return nil if country_code.nil? || country_code.empty?

  CITY_NAME_TO_UNLOCODE[[city_name, country_code]]
end

def meeting_status(date_end)
  return "upcoming" unless date_end
  parsed = (Date.parse(date_end) rescue nil)
  return "upcoming" unless parsed
  parsed < Date.today ? "completed" : "upcoming"
end

def lang_three_letter(two_or_three)
  return two_or_three if two_or_three.length == 3
  { "en" => "eng", "fr" => "fra" }.fetch(two_or_three, two_or_three)
end

# Expand a manifest language tag into the list of ISO 639-3 codes it
# covers. Bilingual PDFs serve both eng and fra; everything else maps
# 1:1.
def langs_for(tag)
  case tag.to_s
  when "bilingual" then %w[eng fra]
  when "fr"        then %w[fra]
  else                  %w[eng]
  end
end

def emit_yaml(data)
  out = +"---\n"
  out << "# yaml-language-server: $schema=#{SCHEMA_REF}\n"
  out << "# Auto-generated by scripts/generate_meetings.rb.\n"
  out << data.to_yaml.sub(/^---\s*$/, "").lstrip
  out
end

emit = {}
meetings.each do |(kind, ord), m|
  next if kind.nil?

  meta = m[:meta]
  city_name = meta["city"]
  country_code = meta["country_code"]
  venue = meta["venue"] || ""
  virtual = venue.empty? || venue.casecmp("online meeting").zero?
  city = unlocode_for(city_name, country_code)

  identifiers = identifiers_for(kind, ord)
  urn = meeting_urn(kind, ord)
  slug = meeting_slug(kind, ord)
  year = meeting_year(meta["date_start"]) || meta["year"]
  status = meeting_status(meta["date_end"])

  # Source URLs: one entry per ISO 639-3 language actually served.
  # Bilingual PDFs produce two entries (eng + fra) pointing at the
  # same URL — the schema requires `language_code` to match ^[a-z]{3}$.
  source_urls = m[:urls].flat_map do |lang, url|
    langs_for(lang).map do |code|
      {
        "ref"           => url,
        "format"        => "pdf",
        "language_code" => code,
        "kind"          => "resolutions_pdf",
      }
    end
  end

  localizations = m[:languages].keys.sort.flat_map do |lang|
    langs_for(lang).map do |code|
      {
        "language_code" => code,
        "script"        => "Latn",
        "title"         => m[:languages][lang]["title"] || locale_label(kind, ord, code),
        "general_area"  => venue,
      }
    end
  end.uniq { |loc| loc["language_code"] }

  agenda = nil
  unless m[:languages].empty?
    # The agenda items link resolutions by agenda_item label. We don't
    # have agenda info in the manifest; downstream code may synthesize
    # it from the matched resolutions.
    agenda = { "status" => "final" }
  end

  data = {
    "identifier"  => identifiers,
    "urn"         => urn,
    "type"        => meeting_type(kind),
    "status"      => status,
    "year"        => year,
    "ordinal"     => ord,
    "date_range"  => {
      "start" => meta["date_start"],
      "end"   => meta["date_end"],
    },
    "committee"   => committee_label(kind),
    "general_area" => venue,
    "virtual"      => virtual,
    "source_urls"  => source_urls,
    "localizations" => localizations,
    "agenda"        => agenda,
    "resolution_refs" => ["urn:oiml:#{kind}:resolution-collection:#{slug}-resolutions"],
  }
  # city / country_code are optional in the schema but require a strict
  # pattern (UN/LOCODE + ISO 3166-1 alpha-2). Omit when nil/empty so we
  # don't emit `city: null` or `country_code: ''` that the validator
  # rejects. Virtual meetings have no host city by definition.
  data["city"] = city if city && !city.empty?
  data["country_code"] = country_code if country_code && !country_code.empty?
  emit[[kind, ord]] = data
end

emit.each do |(kind, ord), data|
  out_path = File.join(OUT_DIR, "#{meeting_slug(kind, ord)}.yaml")
  File.write(out_path, emit_yaml(data))
  puts "Wrote #{out_path} (#{data["localizations"].size} lang(s), #{data["source_urls"].size} URLs)"
end
