#!/usr/bin/env ruby
# frozen_string_literal: true

# Backfill `urn:` on every AgendaItem across all meeting YAMLs. The URN
# is derived from the parent meeting URN + the item label using
# Edoxen::UrnFor.agenda_item:
#
#   urn:oiml:ciml:meeting:ciml-60:agenda:6.2
#
# Idempotent: items that already carry a URN are left alone. Set
# FIX_RESOLUTION_DATA_ROOT to override the repo root.

$LOAD_PATH.unshift(File.expand_path("../lib", __dir__))
require "oiml/resolutions_data"

module ResolutionsData
  module BackfillAgendaItemUrns
    class << self
      def root_dir
        ENV["FIX_RESOLUTION_DATA_ROOT"] || File.expand_path("..", __dir__)
      end

      def meetings_dir
        File.join(root_dir, "meetings")
      end

      def run
        require "edoxen"
        changed_files = 0
        urn_count = 0
        each_meeting_yaml do |path|
          count = process_file(path)
          if count.positive?
            changed_files += 1
            urn_count += count
          end
        end
        puts "Backfilled #{urn_count} agenda item URN(s) across #{changed_files} meeting file(s)."
      end

      def process_file(path)
        require "edoxen"
        raw = File.read(path)
        segments = raw.split(/^---\s*$/, 3)
        return 0 if segments.size < 2

        preamble = segments[0].to_s
        yaml_body = expand_aliases(segments[1])
        meeting = Edoxen::Meeting.from_yaml(yaml_body)
        meeting_urn = meeting.urn&.to_s
        return 0 unless meeting_urn && !meeting_urn.empty? && meeting.agenda&.items&.any?

        added = 0
        meeting.agenda.items.each do |item|
          next if item.urn && !item.urn.to_s.empty?
          next unless item.label && !item.label.to_s.empty?
          item.urn = Edoxen::UrnFor.agenda_item(meeting_urn: meeting_urn, label: item.label.to_s)
          added += 1
        end
        return 0 unless added.positive?

        File.write(path, preamble + "---\n" + meeting.to_yaml.sub(/\A---\s*\n/, ""))
        added
      rescue => e
        warn "  FAIL #{File.basename(path)}: #{e.class}: #{e.message[0, 120]}"
        0
      end

      def expand_aliases(raw_yaml)
        return raw_yaml unless raw_yaml.include?("&")
        loaded = Psych.load(raw_yaml, aliases: true)
        deduped = deep_copy(loaded)
        Psych.dump(deduped).sub(/\A---\s*\n/, "")
      rescue
        raw_yaml
      end

      def deep_copy(obj)
        case obj
        when Hash  then obj.transform_values { |v| deep_copy(v) }
        when Array then obj.map { |v| deep_copy(v) }
        else obj.dup
        end
      end

      def each_meeting_yaml
        Dir.glob(File.join(meetings_dir, "*.yaml")).sort.each do |path|
          next if File.basename(path).start_with?("_")
          yield path
        end
      end
    end
  end
end

ResolutionsData::BackfillAgendaItemUrns.run
