#!/usr/bin/env ruby
# frozen_string_literal: true

# Merge per-language resolution YAMLs into one Edoxen-shaped YAML per
# meeting, with each resolution carrying parallel `localizations[]`
# entries (eng + fra when both are available).
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
#     resolutions:
#       - identifier: CIML/2009/1
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
    # Single-language Bulletin files (e.g. 15CIML-1976-FR) — keep the
    # filename as the slug; language is derived from the FR/EN suffix
    # that's already part of the slug, not a separate -en/-fr tail.
    [base, nil]
  end
end

def lang_for_collection(slug, lang_suffix)
  return lang_suffix if lang_suffix
  # Bulletin-style slug like 15CIML-1976-FR or 17CIML-1980-EN.
  case slug
  when /-FR\z/ then "fra"
  when /-EN\z/ then "eng"
  else "eng"
  end
end

# Group files by collection slug. Each collection may have one or two
# language files.
files = Dir.glob(File.join(DIR, "*.yaml")).reject { |p| File.basename(p).start_with?("_") }

by_collection = Hash.new { |h, k| h[k] = { files: [], langs: [] } }
files.each do |path|
  slug, lang_suffix = split_collection_slug(path)
  collection = by_collection[slug]
  collection[:files] << path
  collection[:langs] << lang_for_collection(slug, lang_suffix)
end

merged_count = 0
by_collection.each do |slug, info|
  # Skip if there's only one file AND its slug already lacks the -en/-fr
  # suffix (it's already a "merged" single-language Bulletin file).
  if info[:files].size == 1 && slug !~ /-(en|fr)\z/
    # Single-language Bulletin; the file is already in its final form.
    # If it has `metadata.title` (single) instead of `title_localized[]`,
    # convert it so the schema is consistent across the corpus.
    path = info[:files].first
    raw = File.read(path)
    parts = raw.split(/^---\s*$/, 3)
    next if parts.size < 2

    preamble = parts[0].to_s
    body = parts[1]
    data = YAML.safe_load(body, permitted_classes: [Date, Time, DateTime]) || {}

    meta = data["metadata"] ||= {}
    title_loc = []
    if meta["title"]
      lang_code = lang_for_collection(slug, nil)
      title_loc << { "language_code" => lang_code, "title" => meta["title"] }
    end
    meta["title_localized"] = title_loc if title_loc.any? && !meta["title_localized"]

    # Wrap each resolution's per-lang content in localizations[].
    res_list = data["resolutions"] || []
    lang_code = lang_for_collection(slug, nil)
    res_list.each do |res|
      next if res["localizations"]&.any?
      loc = {
        "language_code" => lang_code,
        "title" => res.delete("title"),
      }
      # Move per-lang fields under the localization.
      loc["subject"] = res.delete("subject") if res["subject"]
      loc["considerations"] = res.delete("considerations") if res["considerations"]
      loc["actions"] = res.delete("actions") if res["actions"]
      loc["approvals"] = res.delete("approvals") if res["approvals"]
      res["localizations"] = [loc]
    end

    File.write(path, "#{preamble}---\n#{YAML.dump(data).sub(/\A---\s*\n/, "")}")
    next
  end

  # Multi-language collection (e.g. ciml-44-resolutions + EN + FR).
  parsed = info[:files].map do |path|
    raw = File.read(path)
    parts = raw.split(/^---\s*$/, 3)
    data = YAML.safe_load(parts[1], permitted_classes: [Date, Time, DateTime]) || {}
    [path, data]
  end

  # Build a merged metadata block: take the first file's metadata as
  # the base, replace `title` with `title_localized[]`.
  base_path, base_data = parsed.first
  base_meta = base_data["metadata"] || {}
  merged_meta = base_meta.reject { |k, _| k == "title" }
  title_loc = parsed.map do |(path, data)|
    meta = data["metadata"] || {}
    slug_for_lang, lang_suffix = split_collection_slug(path)
    lang_code = lang_for_collection(slug_for_lang, lang_suffix)
    { "language_code" => lang_code, "title" => meta["title"] || "" }
  end
  merged_meta["title_localized"] = title_loc

  # Index resolutions by identifier for each language.
  by_lang = {}
  parsed.each do |(path, data)|
    slug_for_lang, lang_suffix = split_collection_slug(path)
    lang_code = lang_for_collection(slug_for_lang, lang_suffix)
    by_lang[lang_code] = {}
    (data["resolutions"] || []).each do |res|
      # identifier in our YAMLs is a string ("CIML/2009/1"), not the
      # schema's StructuredIdentifier array.
      key = res["identifier"].is_a?(Array) \
        ? res["identifier"].map { |i| i["id"] || i }.join("/")
        : res["identifier"].to_s
      key = res["urn"] || key if key.empty?
      by_lang[lang_code][key] = res
    end
  end

  # Union of all identifiers across languages.
  all_keys = by_lang.values.map(&:keys).flatten.uniq

  merged_resolutions = all_keys.map do |key|
    # Pick the first language's record as the base for language-agnostic
    # fields (identifier, doi, urn, dates, agenda_item).
    base_res = nil
    localizations = []
    by_lang.each do |lang_code, hash|
      res = hash[key]
      next unless res

      unless base_res
        base_res = res.dup
        base_res.delete("title")
        base_res.delete("subject")
        base_res.delete("considerations")
        base_res.delete("actions")
        base_res.delete("approvals")
      end

      loc = { "language_code" => lang_code }
      loc["title"] = res["title"] if res["title"]
      loc["subject"] = res["subject"] if res["subject"]
      loc["considerations"] = res["considerations"] if res["considerations"]
      loc["actions"] = res["actions"] if res["actions"]
      loc["approvals"] = res["approvals"] if res["approvals"]
      localizations << loc
    end
    next unless base_res

    # Preserve original identifier order (eng before fra where possible).
    ordered_locs = localizations.sort_by { |l| l["language_code"] == "eng" ? 0 : 1 }
    base_res["localizations"] = ordered_locs
    base_res
  end.compact

  # Sort resolutions by their identifier when possible.
  merged_resolutions.sort_by! do |res|
    s = res["identifier"].is_a?(Array) \
      ? res["identifier"].map { |i| i["id"] || i }.join("/")
      : res["identifier"].to_s
    # CIML/2009/1 → [2009, 1]; CIML/2009/9.2 → [2009, 9.2]
    if s =~ %r{\A(?:CIML|Conference)/(\d+)/(.+)\z}
      [$1.to_i, $2.split(".").map { |x| x.to_i }]
    else
      [9999, [s]]
    end
  end

  merged = {
    "metadata" => merged_meta,
    "resolutions" => merged_resolutions,
  }

  out_path = File.join(DIR, "#{slug}.yaml")
  preamble = "---\n# Merged by scripts/merge_resolution_yamls.rb from:\n#   #{info[:files].map { |p| File.basename(p) }.join(', ')}\n"
  File.write(out_path, preamble + YAML.dump(merged).sub(/\A---\s*\n/, ""))

  # Delete the per-language source files.
  info[:files].each { |p| File.delete(p) if File.exist?(p) && p != out_path }

  merged_count += 1
  puts "  merged → #{slug}.yaml (#{merged_resolutions.size} resolutions)"
end

puts "Merged into #{merged_count} YAML file(s)."
