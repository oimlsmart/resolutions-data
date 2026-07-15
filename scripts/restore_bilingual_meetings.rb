#!/usr/bin/env ruby
# frozen_string_literal: true

# Restore bilingual (EN+FR) data in meeting YAMLs from the v2 git
# history (commit 5a14e66). The edoxen 1.0 migration converted
# `localizations[]` to per-field `LocalizedString[]` but dropped the
# French entries for most meetings.
#
# For each meeting YAML:
#   1. Read the v2 version from git (5a14e66:<path>)
#   2. Extract title + general_area per language_code
#   3. In the current file, set:
#        title: [{spelling: eng, value: ...}, {spelling: fra, value: ...}]
#        general_area: [{spelling: eng, value: ...}, {spelling: fra, value: ...}]
#   4. Preserve all other fields unchanged
#
# Idempotent: if both languages are already present, no change.

require "yaml"
require "open3"

ROOT = File.expand_path("..", __dir__)
MEETINGS_DIR = File.join(ROOT, "meetings")
V2_COMMIT = "5a14e66"

LANG_MAP = { "eng" => "eng", "fra" => "fra" }.freeze

def read_v2_localizations(path)
  out, = Open3.capture2("git", "show", "#{V2_COMMIT}:#{path}")
  return nil unless out && !out.empty?

  data = YAML.safe_load(out, permitted_classes: [Date, Time, DateTime])
  return nil unless data && data["localizations"]

  data["localizations"].each_with_object({}) do |loc, acc|
    lang = loc["language_code"]
    next unless lang
    acc[lang] = {
      "title" => loc["title"],
      "general_area" => loc["general_area"],
    }
  end
rescue StandardError
  nil
end

def to_localized_string(v2_locs, field)
  entries = []
  %w[eng fra].each do |lang|
    val = v2_locs.dig(lang, field)
    next unless val && !val.to_s.strip.empty?
    entries << { "spelling" => lang, "value" => val }
  end
  entries.empty? ? nil : entries
end

def process_file(path)
  rel_path = path.sub("#{ROOT}/", "")
  v2_locs = read_v2_localizations(rel_path)
  return false unless v2_locs && v2_locs.any?

  raw = File.read(path)
  segments = raw.split(/^---\s*$/, 3)
  return false if segments.size < 2

  preamble = segments[0].to_s
  data = YAML.safe_load(segments[1], permitted_classes: [Date, Time, DateTime]) || {}

  changed = false

  # title
  v2_title = to_localized_string(v2_locs, "title")
  if v2_title && v2_title.size > (data["title"]&.size || 0)
    data["title"] = v2_title
    changed = true
  end

  # general_area
  v2_area = to_localized_string(v2_locs, "general_area")
  if v2_area && v2_area.size > (data["general_area"]&.size || 0)
    data["general_area"] = v2_area
    changed = true
  end

  return false unless changed

  File.write(path, preamble + "---\n" + YAML.dump(data).sub(/\A---\s*\n/, ""))
  true
end

count = 0
Dir.glob(File.join(MEETINGS_DIR, "*.yaml")).sort.each do |path|
  changed = process_file(path)
  next unless changed

  count += 1
  puts "  restored bilingual: #{File.basename(path)}"
end

puts "\nRestored bilingual data in #{count} meeting YAML(s)."
