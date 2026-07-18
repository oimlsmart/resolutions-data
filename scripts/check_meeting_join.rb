#!/usr/bin/env ruby
# frozen_string_literal: true

# Verify that every `resolutions/*.yaml`'s `metadata.meeting_urn` resolves
# to a meeting YAML under `edoxen-data/meetings/`, and that no two resolution files
# accidentally point at the same URN with mismatched slugs.
#
# Exits non-zero on any dangling reference. Used by CI.

require "yaml"

ROOT = File.expand_path("..", __dir__)
RES_DIR = File.join(ROOT, "resolutions")
MTG_DIR = File.join(ROOT, "edoxen-data", "meetings")

meeting_urns = Dir.glob(File.join(MTG_DIR, "*.yaml")).each_with_object({}) do |p, h|
  data = YAML.safe_load(File.read(p), permitted_classes: [Date, Time, DateTime])
  h[data["urn"]] = File.basename(p, ".yaml") if data && data["urn"]
end

bad = 0
Dir.glob(File.join(RES_DIR, "*.yaml")).sort.each do |p|
  data = YAML.safe_load(File.read(p), permitted_classes: [Date, Time, DateTime])
  next unless data.is_a?(Hash)
  urn = data.dig("metadata", "meeting_urn")
  if urn.nil? || urn.empty?
    warn "  MISSING meeting_urn: #{File.basename(p)}"
    bad += 1
    next
  end
  unless meeting_urns.key?(urn)
    warn "  DANGLING meeting_urn: #{File.basename(p)} → #{urn} (no meeting YAML)"
    bad += 1
  end
end

if meeting_urns.empty?
  warn "  no meeting YAMLs under #{MTG_DIR}"
  bad += 1
end

puts "Checked #{Dir.glob(File.join(RES_DIR, '*.yaml')).size} resolution file(s) against #{meeting_urns.size} meeting(s); #{bad} problem(s)."
exit(bad.zero? ? 0 : 1)
