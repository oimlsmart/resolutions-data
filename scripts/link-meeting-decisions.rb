#!/usr/bin/env ruby
# frozen_string_literal: true

# Link meetings to their adopted decisions by populating
# meeting.decisions[] from the resolution files' metadata.meeting_urn.
#
# Run from the repo root: ruby scripts/link-meeting-decisions.rb

require "yaml"
require "pathname"

ROOT = Pathname.new(File.expand_path("../..", __FILE__))

# 1. Build meeting URN → meeting file map
meetings = {}
Dir.glob(ROOT.join("meetings", "*.yaml")).each do |f|
  next if File.basename(f) == "README.md"
  m = YAML.load_file(f)
  next unless m && m["urn"]
  meetings[m["urn"]] = { file: f, meeting: m }
end

# 2. Read each resolution file, extract meeting_urn + decision identifiers
linked = 0
Dir.glob(ROOT.join("resolutions", "*.yaml")).sort.each do |f|
  doc = YAML.load_file(f)
  next unless doc && doc["metadata"] && doc["metadata"]["meeting_urn"]

  meeting_urn = doc["metadata"]["meeting_urn"]
  entry = meetings[meeting_urn]
  next unless entry

  decision_ids = (doc["decisions"] || []).filter_map do |d|
    next unless d["identifier"] && d["identifier"][0]
    { "prefix" => d["identifier"][0]["prefix"], "number" => d["identifier"][0]["number"] }
  end

  next if decision_ids.empty?

  entry[:meeting]["decisions"] = decision_ids
  File.write(entry[:file], entry[:meeting].to_yaml)
  linked += 1
  puts "  Linked #{meeting_urn} → #{decision_ids.length} decisions"
end

puts "\nLinked #{linked} meetings to their decisions"
