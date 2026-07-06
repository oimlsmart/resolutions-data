#!/usr/bin/env ruby
# frozen_string_literal: true

# Fix v2 schema compliance issues in resolutions/*.yaml:
#
# 1. Decision-level dates[].type: "decision" → "decided"
# 2. Action-level dates: [{date, type}] → date_effective: {date, type}
# 3. Consideration-level dates: [{date, type}] → date_effective: {date, type}
# 4. Approval-level dates: [{date, type}] → date_effective: {date, type}

require "yaml"

ROOT = File.expand_path("..", __dir__)
DIR = File.join(ROOT, "resolutions")

VALID_DATE_TYPES = %w[adoption drafted discussed proposed decided
                      negatived withdrawn published effective].freeze

count = 0
Dir.glob(File.join(DIR, "*.yaml")).sort.each do |path|
  next if File.basename(path).start_with?("_")

  raw = File.read(path)
  parts = raw.split(/^---\s*$/, 3)
  preamble = parts[0].to_s
  data = YAML.safe_load(parts[1], permitted_classes: [Date, Time, DateTime]) || {}
  changed = false

  decisions = data["decisions"] || []

  decisions.each do |dec|
    # Fix decision-level dates type values
    (dec["dates"] || []).each do |d|
      if d["type"] == "decision"
        d["type"] = "decided"
        changed = true
      end
    end

    # Fix action/consideration/approval dates → date_effective
    (dec["localizations"] || []).each do |loc|
      %w[actions considerations approvals].each do |field|
        items = loc[field]
        next unless items.is_a?(Array)

        items.each do |item|
          dates = item.delete("dates")
          next unless dates.is_a?(Array) && !dates.empty?

          first = dates.first
          if first.is_a?(Hash)
            # Ensure type is valid
            t = first["type"] || "effective"
            t = "decided" if t == "decision"
            t = "effective" unless VALID_DATE_TYPES.include?(t)
            item["date_effective"] = { "date" => first["date"], "type" => t }
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

puts "Fixed #{count} resolution YAML(s) for v2 schema compliance."
