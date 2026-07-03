#!/usr/bin/env ruby
# frozen_string_literal: true

# Stamp CIML 15-38 + Conference 12-17 meeting metadata (date_range,
# city, country_code, general_area) onto meetings/*.yaml.
#
# CIML 39-60 are already populated from manifest.yaml. The older ones
# (15-38) lack date/place metadata; we hand-curate it from the OCR'd
# cover pages (Paris 1976, Washington 1980, … — values are anchored
# to the cover-page text and authoritative OIML public records).

require "yaml"

ROOT      = File.expand_path("..", __dir__)
DIR       = File.join(ROOT, "meetings")
COUNTRIES = {
  "FR" => "France", "DE" => "Germany", "US" => "United States of America",
  "GB" => "United Kingdom", "DK" => "Denmark", "FI" => "Finland", "SE" => "Sweden",
  "PT" => "Portugal", "AU" => "Australia", "GR" => "Greece", "CN" => "China",
  "CA" => "Canada", "BR" => "Brazil", "KR" => "Republic of Korea", "TN" => "Tunisia",
  "RU" => "Russian Federation", "JP" => "Japan", "IT" => "Italy", "AT" => "Austria",
  "PL" => "Poland", "BE" => "Belgium", "NL" => "Netherlands", "CH" => "Switzerland",
  "ES" => "Spain", "HU" => "Hungary", "RO" => "Romania", "BG" => "Bulgaria",
  "TR" => "Türkiye", "CZ" => "Czechia", "SK" => "Slovakia", "IN" => "India",
  "EG" => "Egypt", "ZA" => "South Africa", "MX" => "Mexico", "AR" => "Argentina",
  "CL" => "Chile", "PE" => "Peru", "KE" => "Kenya", "IE" => "Ireland",
  "NO" => "Norway", "IS" => "Iceland", "CO" => "Colombia", "MA" => "Morocco",
  "DZ" => "Algeria", "NG" => "Nigeria", "GH" => "Ghana", "ET" => "Ethiopia",
  "TZ" => "Tanzania", "NZ" => "New Zealand", "TH" => "Thailand", "VN" => "Viet Nam",
  "MY" => "Malaysia", "ID" => "Indonesia", "PH" => "Philippines", "SG" => "Singapore",
  "TW" => "Chinese Taipei", "HK" => "Hong Kong, China",
}.freeze

# UN/LOCODE → English city name. The meeting YAML's `city` field stores
# the UN/LOCODE (machine-readable); `general_area` stores the
# human-readable "City, Country" form derived from this map.
UNLOCODE_TO_CITY = {
  "FRPAR" => "Paris",          "USWAS" => "Washington",    "DKCPH" => "Copenhagen",
  "FIHEL" => "Helsinki",       "AUSYD" => "Sydney",        "PTOPO" => "Oporto",
  "GRVOU" => "Vouliagmeni",    "DEBER" => "Berlin",        "CNBJS" => "Beijing",
  "CAVAN" => "Vancouver",      "BRRIO" => "Rio de Janeiro","KRSEL" => "Seoul",
  "TNTUN" => "Tunis",          "GBLON" => "London",        "RUMOW" => "Moscow",
  "FRSJL" => "Saint-Jean-de-Luz", "JPUKH" => "Kyoto",      "FRLYS" => "Lyon",
  "ZACPT" => "Cape Town",      "CNSHA" => "Shanghai",      "KEMBA" => "Mombasa",
  "USORL" => "Orlando",        "CZPRG" => "Prague",        "ROBUH" => "Bucharest",
  "VNSGN" => "Ho Chi Minh City","NZAKL" => "Auckland",     "FRARC" => "Arcachon",
  "FRSTR" => "Strasbourg",     "COCTG" => "Cartagena de Indias", "DEHAM" => "Hamburg",
  "SKBTS" => "Bratislava",     "THCNM" => "Chiang Mai",
}.freeze

# Hand-curated from OCR'd cover pages. Keys: meeting URN slug.
# Cover-page lines confirmed in the README of each ocr/md file.
METADATA = {
  # CIML 15-38 (older scanned minutes; no manifest entry, derived from cover).
  # `city` is UN/LOCODE (5-char code); the UI resolves it via the
  # unlocodeToCity map in browser/src/data/cities.yaml.
  "ciml-15" => { year: 1976, date_start: "1976-10-05", date_end: "1976-10-12", city: "FRPAR", cc: "FR" },
  "ciml-16" => { year: 1978, date_start: "1978-06-19", date_end: "1978-06-21", city: "FRPAR", cc: "FR" },
  "ciml-17" => { year: 1980, date_start: "1980-06-16", date_end: "1980-06-20", city: "USWAS", cc: "US" },
  "ciml-18" => { year: 1982, date_start: "1982-03-24", date_end: "1982-03-26", city: "FRPAR", cc: "FR" },
  "ciml-19" => { year: 1983, date_start: "1983-05-03", date_end: "1983-05-05", city: "DKCPH", cc: "DK" },
  "ciml-20" => { year: 1984, date_start: "1984-10-01", date_end: "1984-10-05", city: "FIHEL", cc: "FI" },
  "ciml-21" => { year: 1986, date_start: "1986-04-16", date_end: "1986-04-18", city: "FRPAR", cc: "FR" },
  "ciml-22" => { year: 1987, date_start: "1987-09-02", date_end: "1987-09-04", city: "FRPAR", cc: "FR" },
  "ciml-23" => { year: 1988, date_start: "1988-10-24", date_end: "1988-10-28", city: "AUSYD", cc: "AU" },
  "ciml-24" => { year: 1989, date_start: "1989-09-27", date_end: "1989-09-29", city: "FRPAR", cc: "FR" },
  "ciml-25" => { year: 1990, date_start: "1990-10-03", date_end: "1990-10-05", city: "PTOPO", cc: "PT" },
  "ciml-26" => { year: 1991, date_start: "1991-10-07", date_end: "1991-10-09", city: "FRPAR", cc: "FR" },
  "ciml-27" => { year: 1992, date_start: "1992-11-02", date_end: "1992-11-06", city: "GRVOU", cc: "GR" },
  "ciml-28" => { year: 1993, date_start: "1993-10-04", date_end: "1993-10-06", city: "DEBER", cc: "DE" },
  "ciml-29" => { year: 1994, date_start: "1994-10-12", date_end: "1994-10-14", city: "FRPAR", cc: "FR" },
  "ciml-30" => { year: 1995, date_start: "1995-10-25", date_end: "1995-10-27", city: "CNBJS", cc: "CN" },
  "ciml-31" => { year: 1996, date_start: "1996-11-04", date_end: "1996-11-08", city: "CAVAN", cc: "CA" },
  "ciml-32" => { year: 1997, date_start: "1997-10-29", date_end: "1997-10-31", city: "BRRIO", cc: "BR" },
  "ciml-33" => { year: 1998, date_start: "1998-10-28", date_end: "1998-10-30", city: "KRSEL", cc: "KR" },
  "ciml-34" => { year: 1999, date_start: "1999-10-06", date_end: "1999-10-08", city: "TNTUN", cc: "TN" },
  "ciml-35" => { year: 2000, date_start: "2000-10-09", date_end: "2000-10-13", city: "GBLON", cc: "GB" },
  "ciml-36" => { year: 2001, date_start: "2001-09-25", date_end: "2001-09-27", city: "RUMOW", cc: "RU" },
  "ciml-37" => { year: 2002, date_start: "2002-10-01", date_end: "2002-10-04", city: "FRSJL", cc: "FR" },
  "ciml-38" => { year: 2003, date_start: "2003-11-05", date_end: "2003-11-08", city: "JPUKH", cc: "JP" },

  # Conference 12-17 (manifest already has metadata; this ensures parity
  # in case the YAML regeneration dropped any fields).
  "conference-12" => { year: 2004, date_start: "2004-10-26", date_end: "2004-10-29", city: "DEBER", cc: "DE" },
  "conference-13" => { year: 2008, date_start: "2008-10-29", date_end: "2008-10-31", city: "AUSYD", cc: "AU" },
  "conference-14" => { year: 2012, date_start: "2012-10-03", date_end: "2012-10-04", city: "ROBUH", cc: "RO" },
  "conference-15" => { year: 2016, date_start: "2016-10-19", date_end: "2016-10-20", city: "FRSTR", cc: "FR" },
  "conference-16" => { year: 2021, date_start: "2021-10-20", date_end: "2021-10-21", city: "", cc: "" },
  "conference-17" => { year: 2025, date_start: "2025-10-14", date_end: "2025-10-14", city: "FRPAR", cc: "FR" },
}.freeze

def update(path, year:, date_start:, date_end:, city:, cc:)
  raw = File.read(path)
  parts = raw.split(/^---\s*$/, 3)
  preamble, yaml_in = parts[0].to_s, parts[1].to_s
  data = YAML.safe_load(yaml_in, permitted_classes: [Date, Time, DateTime]) || {}
  changed = false

  if data["year"].to_i != year
    data["year"] = year
    changed = true
  end

  dr = data["date_range"] ||= {}
  if dr["start"] != date_start
    dr["start"] = date_start
    changed = true
  end
  if dr["end"] != date_end
    dr["end"] = date_end
    changed = true
  end
  data["date_range"] = dr

  venue = cc.empty? ? "Online meeting" : "#{UNLOCODE_TO_CITY.fetch(city, city)}, #{COUNTRIES[cc] || cc}"
  if data["general_area"] != venue
    data["general_area"] = venue
    changed = true
  end
  data["virtual"] = cc.empty? ? true : false if data["virtual"].nil?

  existing = data["city"].to_s
  # Overwrite if (a) missing/empty, or (b) garbage from an earlier broken
  # extraction (more than ~3 words — city names are short).
  if existing.empty? || existing.split.size > 3
    data["city"] = city if cc != ""
    changed = true
  end
  if (!data["country_code"] || data["country_code"].to_s.empty?) && cc != ""
    data["country_code"] = cc
    changed = true
  end

  # Localizations: update general_area on existing entries.
  if (locs = data["localizations"]).is_a?(Array)
    locs.each do |l|
      if l["general_area"] != venue
        l["general_area"] = venue
        changed = true
      end
    end
    data["localizations"] = locs
  end

  File.write(path, "#{preamble}---\n#{YAML.dump(data).sub(/\A---\s*\n/, "")}")
  changed
end

count = 0
METADATA.each do |slug, meta|
  path = File.join(DIR, "#{slug}.yaml")
  unless File.exist?(path)
    warn "  skip #{slug}: no meeting YAML"
    next
  end
  if update(path, **meta)
    count += 1
    puts "  ok  #{slug} #{meta[:date_start]}..#{meta[:date_end]} #{meta[:city]}"
  else
    puts "  --  #{slug} (already up to date)"
  end
end

puts "#{count} meeting YAML(s) updated."
