#!/usr/bin/env ruby
# frozen_string_literal: true

# Apply the curated OIML EN→FR agenda title mapping to every meeting YAML.
# For each agenda item:
#
#   1. Look up the English title value in the mapping.
#   2. If found, ensure a `spelling: fra` entry exists with the French
#      translation. Overwrites when the existing FR value is identical
#      to the English value (the known OCR pipeline artefact where both
#      language slots were filled with the English text).
#
# Conservative: items without a matching English title are left alone.
# Idempotent: re-running produces no changes once FR is correct.

require "yaml"
$LOAD_PATH.unshift(File.expand_path("../lib", __dir__))
require "oiml/resolutions_data"

module ResolutionsData
  module TranslateAgendaTitles
    LANG_EN = "eng".freeze
    LANG_FR = "fra".freeze

    class << self
      def root_dir
        ENV["FIX_RESOLUTION_DATA_ROOT"] || File.expand_path("..", __dir__)
      end

      def meetings_dir
        File.join(root_dir, "meetings")
      end

      def mapping_path
        File.join(root_dir, "scripts", "oiml_agenda_titles.fr.yaml")
      end

      def run
        require "edoxen"
        mapping = YAML.load_file(mapping_path)
        changed_files = 0
        translated = 0
        skipped = 0
        each_meeting_yaml do |path|
          counts = process_file(path, mapping)
          next if counts[:translated].zero?
          changed_files += 1
          translated += counts[:translated]
          skipped += counts[:skipped]
        end
        puts "Translated #{translated} agenda title(s) into French across #{changed_files} file(s)."
        puts "Skipped #{skipped} item(s) with no mapping match." unless skipped.zero?
      end

      def process_file(path, mapping)
        require "edoxen"
        raw = File.read(path)
        segments = raw.split(/^---\s*$/, 3)
        return { translated: 0, skipped: 0 } if segments.size < 2

        preamble = segments[0].to_s
        yaml_body = expand_aliases(segments[1])
        meeting = Edoxen::Meeting.from_yaml(yaml_body)
        return { translated: 0, skipped: 0 } unless meeting.agenda&.items&.any?

        translated = 0
        skipped = 0
        meeting.agenda.items.each do |item|
          next unless item.title&.any?
          eng = item.title.find { |ls| ls.spelling.to_s.start_with?("en") }
          next unless eng && eng.value
          translation = mapping[eng.value.to_s.strip]
          if translation.nil?
            skipped += 1
            next
          end
          # Find existing FR entry; create/overwrite as needed.
          fr = item.title.find { |ls| ls.spelling.to_s.start_with?("fr") || ls.spelling.to_s == "fre" }
          if fr.nil?
            item.title << Edoxen::LocalizedString.new(spelling: LANG_FR, value: translation)
            translated += 1
          elsif fr.value.to_s == eng.value.to_s || fr.value.to_s.strip != translation
            next if fr.value.to_s.strip == translation
            fr.value = translation
            translated += 1
          end
        end
        return { translated: 0, skipped: skipped } if translated.zero?

        File.write(path, preamble + "---\n" + meeting.to_yaml.sub(/\A---\s*\n/, ""))
        { translated: translated, skipped: skipped }
      rescue => e
        warn "  FAIL #{File.basename(path)}: #{e.class}: #{e.message[0, 120]}"
        { translated: 0, skipped: 0 }
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

ResolutionsData::TranslateAgendaTitles.run
