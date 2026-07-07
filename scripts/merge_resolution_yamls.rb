#!/usr/bin/env ruby
# frozen_string_literal: true

# Merge per-language decision YAMLs (v2 edoxen format) into one
# DecisionCollection YAML per meeting, with each decision carrying
# parallel `localizations[]` entries (eng + fra when both available).
#
# Input (one YAML per (meeting, language)):
#   resolutions/ciml-44-resolutions-en.yaml
#   resolutions/ciml-44-resolutions-fr.yaml
#
# Output (one YAML per meeting):
#   resolutions/ciml-44-resolutions.yaml
#     metadata:
#       title_localized:
#         - language_code: eng
#           title: "44th CIML Meeting — Resolutions (EN)"
#         - language_code: fra
#           title: "44e réunion du CIML — Résolutions (FR)"
#     decisions:
#       - identifier: [{prefix: CIML, number: 2009/1}]
#         urn: ...
#         doi: ...
#         localizations:
#           - language_code: eng
#             title: ...
#             actions: [...]
#           - language_code: fra
#             title: ...
#             actions: [...]
#
# One YAML per meeting = one card on the meeting page, regardless of
# how many languages the source PDFs cover.

require "yaml"
require "fileutils"

ROOT = File.expand_path("..", __dir__)
DIR  = File.join(ROOT, "resolutions")

# Convert "ciml-44-resolutions-en" or "ciml-44-resolutions-fr" →
# "ciml-44-resolutions" (the canonical collection slug) and yield the
# language code separately. Returns [slug, lang_code] or nil if the
# filename doesn't end in -en/-fr.
def split_collection_slug(filename)
  base = File.basename(filename, ".yaml")
  if base =~ /\A(.*)-(en|fr)\z/
    [$1, $2 == "en" ? "eng" : "fra"]
  else
    [base, nil]
  end
end

def lang_for_collection(slug, lang_suffix)
  return lang_suffix if lang_suffix
  case slug
  when /-FR\z/ then "fra"
  when /-EN\z/ then "eng"
  else "eng"
  end
end

files = Dir.glob(File.join(DIR, "*.yaml")).reject { |p| File.basename(p).start_with?("_") }

per_lang_files = []
already_merged_files = []
files.each do |path|
  base = File.basename(path, ".yaml")
  if base =~ /\A(.*)-(en|fr)\z/
    per_lang_files << path
  else
    already_merged_files << path
  end
end

by_collection = Hash.new { |h, k| h[k] = { files: [], langs: [] } }
per_lang_files.each do |path|
  slug, lang_suffix = split_collection_slug(path)
  collection = by_collection[slug]
  collection[:files] << path
  collection[:langs] << lang_for_collection(slug, lang_suffix)
end

merged_count = 0

# Already-merged single-lang files: ensure they carry localizations[].
# Idempotent — no-op if the data is already in the localizations shape.
already_merged_files.each do |path|
  raw = File.read(path)
  parts = raw.split(/^---\s*$/, 3)
  next if parts.size < 2

  preamble = parts[0].to_s
  data = YAML.safe_load(parts[1], permitted_classes: [Date, Time, DateTime]) || {}

  decisions = data["decisions"] || data["resolutions"] || []
  next if decisions.empty?

  lang_code = lang_for_collection(File.basename(path, ".yaml"), nil)
  needs_migration = decisions.any? { |d| !d["localizations"] || d["localizations"].empty? }
  next unless needs_migration

  decisions.each do |res|
    next if res["localizations"]&.any?
    loc = { "language_code" => lang_code }
    loc["title"] = res.delete("title") if res["title"]
    loc["subject"] = res.delete("subject") if res["subject"]
    loc["considerations"] = res.delete("considerations") || []
    loc["actions"] = res.delete("actions") || []
    loc["approvals"] = res.delete("approvals") || []
    res["localizations"] = [loc]
  end

  data["decisions"] = decisions
  data.delete("resolutions")

  File.write(path, "#{preamble}---\n#{YAML.dump(data).sub(/\A---\s*\n/, "")}")
end

# Merge per-lang files into one collection per slug.
by_collection.each do |slug, info|
  parsed = info[:files].map do |path|
    raw = File.read(path)
    parts = raw.split(/^---\s*$/, 3)
    data = YAML.safe_load(parts[1], permitted_classes: [Date, Time, DateTime]) || {}
    [path, data]
  end

  base_path, base_data = parsed.first
  base_meta = base_data["metadata"] || {}
  merged_meta = base_meta.dup
  title_loc = parsed.map do |(path, data)|
    meta = data["metadata"] || {}
    slug_for_lang, lang_suffix = split_collection_slug(path)
    lang_code = lang_for_collection(slug_for_lang, lang_suffix)
    { "language_code" => lang_code, "title" => (meta["title_localized"] && meta["title_localized"].first && meta["title_localized"].first["title"]) || meta["title"] || "" }
  end
  merged_meta["title_localized"] = title_loc
  merged_meta.delete("title")

  # Index decisions by identifier for each language.
  by_lang = {}
  parsed.each do |(path, data)|
    slug_for_lang, lang_suffix = split_collection_slug(path)
    lang_code = lang_for_collection(slug_for_lang, lang_suffix)
    by_lang[lang_code] = {}
    decisions = data["decisions"] || data["resolutions"] || []
    decisions.each do |res|
      ident = res["identifier"]
      key = ident.is_a?(Array) \
        ? ident.map { |i| i.is_a?(Hash) ? "#{i['prefix']}/#{i['number']}" : i.to_s }.join(" / ")
        : ident.to_s
      key = res["urn"] || key if key.empty?
      by_lang[lang_code][key] = res
    end
  end

  all_keys = by_lang.values.map(&:keys).flatten.uniq

  merged_decisions = all_keys.map do |key|
    base_res = nil
    localizations = []
    by_lang.each do |lang_code, hash|
      res = hash[key]
      next unless res

      unless base_res
        base_res = res.dup
        base_res.delete("localizations")
      end

      loc = res["localizations"]&.find { |l| l["language_code"] == lang_code }
      unless loc
        loc = { "language_code" => lang_code }
        loc["title"] = res["title"] if res["title"]
        loc["subject"] = res["subject"] if res["subject"]
        loc["considerations"] = res["considerations"] || []
        loc["actions"] = res["actions"] || []
        loc["approvals"] = res["approvals"] || []
      end
      localizations << loc
    end
    next unless base_res

    ordered_locs = localizations.sort_by { |l| l["language_code"] == "eng" ? 0 : 1 }
    base_res["localizations"] = ordered_locs
    base_res
  end.compact

  merged_decisions.sort_by! do |res|
    ident = res["identifier"]
    s = ident.is_a?(Array) \
      ? ident.map { |i| i.is_a?(Hash) ? "#{i['prefix']}/#{i['number']}" : i.to_s }.join("/")
      : ident.to_s
    if s =~ %r{\A(?:CIML|Conference|DC)/(\d+)/(.+)\z}
      [$1.to_i, $2.split(".").map { |x| x.to_f }]
    else
      [9999, [s]]
    end
  end

  merged = {
    "metadata" => merged_meta,
    "decisions" => merged_decisions,
  }

  out_path = File.join(DIR, "#{slug}.yaml")
  preamble = "---\n# Merged by scripts/merge_resolution_yamls.rb from:\n#   #{info[:files].map { |p| File.basename(p) }.join(', ')}\n"
  File.write(out_path, preamble + YAML.dump(merged).sub(/\A---\s*\n/, ""))

  info[:files].each { |p| File.delete(p) if File.exist?(p) && p != out_path }

  merged_count += 1
  puts "  merged → #{slug}.yaml (#{merged_decisions.size} decisions)"
end

puts "Merged into #{merged_count} YAML file(s)."
