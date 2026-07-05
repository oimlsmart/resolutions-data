#!/usr/bin/env ruby
# frozen_string_literal: true

# Convert current meetings/*.yaml + resolutions/*.yaml + agendas/*.yaml
# into the new edoxen-model format: one MeetingCollection YAML per
# meeting, with embedded Agenda + Decision[].
#
# Input:
#   meetings/*.yaml (58 meeting YAMLs in old format)
#   resolutions/*.yaml (56 merged resolution YAMLs with localizations[])
#   agendas/*.yaml (63 agenda YAMLs from parse_agendas.rb)
#
# Output:
#   edoxen-data/meetings/ciml-{N}.yaml
#   edoxen-data/meetings/conference-{N}.yaml
#
# Each output is a single Meeting with:
#   - Embedded agenda (items from agendas/*.yaml)
#   - Embedded decisions[] (from resolutions/*.yaml)
#   - Localizations (from meeting YAML's localizations[])
#   - Venues (derived from city/country_code)
#   - Source URLs (from meeting YAML's source_urls)

require "yaml"
require "fileutils"
require "date"

ROOT = File.expand_path("..", __dir__)
MEETINGS_DIR = File.join(ROOT, "meetings")
RESOLUTIONS_DIR = File.join(ROOT, "resolutions")
AGENDAS_DIR = File.join(ROOT, "agendas")
OUT_DIR = File.join(ROOT, "edoxen-data", "meetings")
FileUtils.mkdir_p(OUT_DIR)

# Map a meeting YAML's resolution_refs to the source_file slugs used
# by the resolutions/ directory.
def source_file_from_urn(urn)
  return nil unless urn
  m = urn.to_s.match(/:resolution-collection:([-\w]+)$/)
  m ? m[1] : nil
end

# Parse a resolution YAML and return an array of Decision hashes.
def parse_resolutions(path)
  data = YAML.safe_load(File.read(path), permitted_classes: [Date, Time, DateTime])
  return [] unless data && data["resolutions"]

  data["resolutions"].map do |res|
    identifier = res["identifier"].to_s

    {
      "identifier" => [{ "prefix" => identifier.split("/")[0] || "CIML",
                          "number" => identifier.split("/", 2)[1].to_s }],
      "kind" => "resolution",
      "status" => "decided",
      "doi" => res["doi"],
      "urn" => res["urn"],
      "agenda_item" => res["agenda_item"],
      "dates" => (res["dates"] || []).map do |d|
        { "date" => d["start"], "type" => d["kind"] || "decided" }
      end,
      "categories" => res["categories"] || [],
      "localizations" => (res["localizations"] || []).map do |loc|
        {
          "language_code" => loc["language_code"],
          "script" => loc["script"] || "Latn",
          "title" => loc["title"],
          "subject" => loc["subject"],
          "considerations" => loc["considerations"] || [],
          "actions" => loc["actions"] || [],
          "approvals" => loc["approvals"] || [],
        }
      end,
    }
  end
end

# Parse an agenda YAML and return the agenda hash.
def parse_agenda(meeting_slug)
  path = File.join(AGENDAS_DIR, "#{meeting_slug}.yaml")
  return { "status" => "draft", "items" => [] } unless File.exist?(path)
  data = YAML.safe_load(File.read(path))
  {
    "status" => data&.dig("status") || "draft",
    "items" => data&.dig("items") || [],
  }
end

# Convert a single meeting YAML.
def convert_meeting(path)
  data = YAML.safe_load(File.read(path), permitted_classes: [Date, Time, DateTime])
  return nil unless data && data["urn"]

  # Extract the meeting slug from the URN.
  slug = begin
    m = data["urn"].to_s.match(/:meeting:([-\w]+)$/)
    m ? m[1] : File.basename(path, ".yaml")
  end

  # Build the new Meeting structure.
  meeting = {
    "identifier" => data["identifier"] || [],
    "urn" => data["urn"],
    "ordinal" => data["ordinal"],
    "type" => data["type"] || "plenary",
    "status" => data["status"] || "completed",
    "date_range" => data["date_range"] || {},
    "committee" => data["committee"],
    "general_area" => data["general_area"],
    "city" => data["city"],
    "country_code" => data["country_code"],
    "virtual" => data["virtual"],
  }

  # Venues: derive from city/country_code or virtual flag.
  if data["virtual"]
    meeting["venues"] = [{ "kind" => "virtual", "name" => "Online meeting" }]
  elsif data["city"] && data["country_code"] && !data["city"].to_s.empty?
    meeting["venues"] = [{
      "kind" => "physical",
      "unlocode" => data["city"],
      "country_code" => data["country_code"],
    }]
  end

  # Source URLs.
  meeting["source_urls"] = data["source_urls"] || []

  # Agenda.
  meeting["agenda"] = parse_agenda(slug)

  # Decisions: find all resolution YAMLs that belong to this meeting.
  decisions = []
  (data["resolution_refs"] || []).each do |ref_urn|
    sf = source_file_from_urn(ref_urn)
    next unless sf

    res_path = File.join(RESOLUTIONS_DIR, "#{sf}.yaml")
    next unless File.exist?(res_path)

    decisions.concat(parse_resolutions(res_path))
  end

  # Also try matching by metadata.meeting_urn.
  if decisions.empty?
    Dir.glob(File.join(RESOLUTIONS_DIR, "*.yaml")).sort.each do |rp|
      next if File.basename(rp).start_with?("_")
      raw = File.read(rp)
      next unless raw.include?(data["urn"])
      decisions.concat(parse_resolutions(rp))
    end
  end

  meeting["decisions"] = decisions

  # Minutes refs.
  meeting["minutes"] = data["minutes"] || []

  # Localizations.
  meeting["localizations"] = (data["localizations"] || []).map do |loc|
    {
      "language_code" => loc["language_code"],
      "script" => loc["script"] || "Latn",
      "title" => loc["title"],
      "general_area" => loc["general_area"],
    }
  end

  meeting
end

# Process all meeting YAMLs.
written = 0
Dir.glob(File.join(MEETINGS_DIR, "*.yaml")).sort.each do |path|
  meeting = convert_meeting(path)
  unless meeting
    warn "  skip #{File.basename(path)}: no data"
    next
  end

  slug = begin
    m2 = meeting["urn"].to_s.match(/:meeting:([-\w]+)$/)
    m2 ? m2[1] : File.basename(path, ".yaml")
  end
  out_path = File.join(OUT_DIR, "#{slug}.yaml")

  File.write(out_path, "---\n# Generated by scripts/convert_to_edoxen_model.rb\n" +
                       YAML.dump(meeting).sub(/\A---\s*\n/, ""))
  written += 1
  decision_count = meeting["decisions"]&.size || 0
  agenda_count = meeting["agenda"]&.dig("items")&.size || 0
  puts "  ok  #{slug} (#{decision_count} decisions, #{agenda_count} agenda items)"
end

puts "\n#{written} meeting YAML(s) written to #{OUT_DIR}/"
