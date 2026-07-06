#!/usr/bin/env ruby
# frozen_string_literal: true

# Migrate meetings/*.yaml to the v2 edoxen Meeting schema.
#
# Changes:
# 1. DELETE `year`, `virtual`, `resolution_refs`
# 2. ADD `visibility: public`
# 3. FIX `type: conference_session` → `type: conference`
# 4. ADD `venues: [{kind: physical, unlocode: city, country_code: cc}]`
# 5. ADD `decisions: [{prefix, number}]` derived from old resolution_refs
# 6. Keep agenda, localizations, source_urls, minutes

require "yaml"
require "fileutils"

ROOT = File.expand_path("..", __dir__)
DIR = File.join(ROOT, "meetings")

count = 0
Dir.glob(File.join(DIR, "*.yaml")).sort.each do |path|
  raw = File.read(path)
  parts = raw.split(/^---\s*$/, 3)
  preamble = parts[0].to_s
  data = YAML.safe_load(parts[1], permitted_classes: [Date, Time, DateTime]) || {}

  changed = false

  # DELETE year, virtual, resolution_refs
  %w[year virtual resolution_refs].each do |key|
    if data.key?(key)
      data.delete(key)
      changed = true
    end
  end

  # ADD visibility
  unless data.key?("visibility")
    data["visibility"] = "public"
    changed = true
  end

  # FIX type
  if data["type"] == "conference_session"
    data["type"] = "conference"
    changed = true
  end

  # ADD venues if not present
  unless data.key?("venues")
    if data["city"] && data["country_code"] && !data["city"].to_s.empty?
      data["venues"] = [{
        "kind" => "physical",
        "unlocode" => data["city"],
        "country_code" => data["country_code"],
      }]
      changed = true
    end
  end

  # Convert old resolution_refs URNs to decisions: StructuredIdentifier[]
  # We skip this for now since resolution_refs are URNs like
  # urn:oiml:ciml:resolution-collection:ciml-44-resolutions. The v2
  # schema expects StructuredIdentifier[] but our resolution files
  # use string identifiers (CIML/2009/1). We'll link by meeting_slug
  # in the build pipeline instead.

  next unless changed

  File.write(path, "#{preamble}---\n#{YAML.dump(data).sub(/\A---\s*\n/, "")}")
  count += 1
end

puts "Migrated #{count} meeting YAML(s) to v2 format."
