#!/usr/bin/env ruby
# frozen_string_literal: true

# Migrate resolutions/*.yaml to the v2 edoxen DecisionCollection schema.
#
# Changes:
# 1. RENAME top-level `resolutions` key → `decisions`
# 2. RESHAPE identifier from string → StructuredIdentifier[]
# 3. RENAME dates[].start → dates[].date
# 4. RENAME dates[].kind → dates[].type
# 5. DELETE metadata.language (language is per-localization)

require "yaml"

ROOT = File.expand_path("..", __dir__)
DIR = File.join(ROOT, "resolutions")

count = 0
Dir.glob(File.join(DIR, "*.yaml")).sort.each do |path|
  next if File.basename(path).start_with?("_")

  raw = File.read(path)
  parts = raw.split(/^---\s*$/, 3)
  preamble = parts[0].to_s
  body = parts[1]
  data = YAML.safe_load(body, permitted_classes: [Date, Time, DateTime]) || {}

  changed = false

  # RENAME resolutions → decisions
  if data.key?("resolutions")
    data["decisions"] = data.delete("resolutions")
    changed = true
  end

  # DELETE metadata.language
  if data["metadata"]&.key?("language")
    data["metadata"].delete("language")
    changed = true
  end

  # RESHAPE each decision's identifier + dates
  decisions = data["decisions"] || []
  decisions.each do |dec|
    # identifier: string → StructuredIdentifier[]
    ident = dec["identifier"]
    if ident.is_a?(String)
      parts_str = ident.split("/", 2)
      prefix = parts_str[0] || "CIML"
      number = parts_str[1] || ident
      dec["identifier"] = [{ "prefix" => prefix, "number" => number }]
      changed = true
    end

    # dates[].start → dates[].date, dates[].kind → dates[].type
    dates = dec["dates"]
    if dates.is_a?(Array)
      dates.each do |d|
        if d.key?("start")
          d["date"] = d.delete("start")
          changed = true
        end
        if d.key?("kind")
          d["type"] = d.delete("kind")
          changed = true
        end
      end
    end

    # localizations[].dates[].start → .date, .kind → .type
    (dec["localizations"] || []).each do |loc|
      (loc["actions"] || []).each do |act|
        (act["dates"] || []).each do |d|
          if d.key?("start")
            d["date"] = d.delete("start")
            changed = true
          end
          if d.key?("kind")
            d["type"] = d.delete("kind")
            changed = true
          end
        end
      end
      (loc["considerations"] || []).each do |cons|
        (cons["dates"] || []).each do |d|
          if d.key?("start")
            d["date"] = d.delete("start")
            changed = true
          end
          if d.key?("kind")
            d["type"] = d.delete("kind")
            changed = true
          end
        end
      end
    end
  end

  next unless changed

  File.write(path, "#{preamble}---\n#{YAML.dump(data).sub(/\A---\s*\n/, "")}")
  count += 1
end

puts "Migrated #{count} resolution YAML(s) to v2 format."
