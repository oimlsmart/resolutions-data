#!/usr/bin/env ruby
# frozen_string_literal: true

# One-shot: add the 10 missing 12th-Conference sub-decisions
# (Conference 2004/1.1–2004/1.9, 2004/4.3) to
# resolutions/conference-12-decisions.yaml, extracted from the
# embedded copies in edoxen-data/meetings/conference-12.yaml.
#
# They are genuine decisions with registered DOIs that existed only
# inside the meeting file — the collection was incomplete. After
# this, scripts/migrate-meetings-1.0.rb can convert the meeting's
# embedded decisions block to refs with zero data loss.

require "yaml"

MEETING = File.expand_path("../edoxen-data/meetings/conference-12.yaml", __dir__)
COLLECTION = File.expand_path("../resolutions/conference-12-decisions.yaml", __dir__)

meeting = YAML.load_file(MEETING)
collection = YAML.load_file(COLLECTION)

existing = collection["decisions"].map { |d| d["identifier"].first["number"] }
missing = meeting["decisions"].reject { |d| existing.include?(d["identifier"].first["number"]) }

abort "expected 10 missing sub-decisions, found #{missing.size}" unless missing.size == 10

# Natural sort: 2004/4.2 < 2004/4.3 < 2004/5 (compare numeric segments).
key = lambda do |d|
  d["identifier"].first["number"].split("/").last.split(".").map(&:to_i)
end

merged = (collection["decisions"] + missing).sort_by(&key)
collection["decisions"] = merged

File.write(COLLECTION, YAML.dump(collection))
puts "added #{missing.map { |d| d['identifier'].first['number'] }.join(', ')}"
puts "collection decisions: #{existing.size} -> #{merged.size}"
