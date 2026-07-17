#!/usr/bin/env ruby
# frozen_string_literal: true

# Strip the "Agenda Item <N>:" / "Point de l'ordre du jour <N>:" prefix from
# every Decision title LocalizedString. The `agenda_item` attribute already
# records the item label separately, and the UI renders it as a localized
# badge next to the title — so echoing it inside the title is redundant and
# blocks proper French rendering (the prefix is always English in the source).
#
# Idempotent: re-running after a successful pass produces no further changes.
# Set FIX_RESOLUTION_DATA_ROOT to override the repo root.

require "yaml"
$LOAD_PATH.unshift(File.expand_path("../lib", __dir__))
require "oiml/resolutions_data"

module ResolutionsData
  module StripAgendaPrefixFromTitles
    PREFIX_RE = /\A\s*(Agenda\s+Item|Point\s+de\s+l['’]ordre\s+du\s+jour|Point)\s+[\d.]+\s*[:：]\s*/i.freeze

    class << self
      def root_dir
        ENV["FIX_RESOLUTION_DATA_ROOT"] || File.expand_path("..", __dir__)
      end

      def resolutions_dir
        File.join(root_dir, "resolutions")
      end

      def run
        require "edoxen"
        changed_files = 0
        stripped_count = 0
        each_resolution_yaml do |path|
          count = process_file(path)
          if count.positive?
            changed_files += 1
            stripped_count += count
          end
        end
        puts "Stripped agenda prefix from #{stripped_count} title(s) across #{changed_files} file(s)."
      end

      # Older files (ciml-34/36/37) carry Psych anchors/aliases emitted by
      # earlier versions of the Edoxen serializer. The model's default loader
      # rejects them, so we preprocess: load with aliases enabled, then emit
      # a fresh YAML with aliases expanded into plain scalars before handing
      # the result to the model.
      # Expand YAML anchors/aliases into plain scalars. Psych.dump re-emits
      # anchors whenever Ruby objects are shared by reference — recursively
      # rebuilding the tree breaks shared identity so the dumped YAML is
      # anchor-free.
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

      def process_file(path)
        require "edoxen"
        raw = File.read(path)
        segments = raw.split(/^---\s*$/, 3)
        return 0 if segments.size < 2

        preamble = segments[0].to_s
        yaml_body = expand_aliases(segments[1])
        collection = Edoxen::DecisionCollection.from_yaml(yaml_body)

        stripped = 0
        collection.decisions.each do |decision|
          stripped += strip_prefix_from(decision)
        end
        return 0 unless stripped.positive?

        # Preserve the preamble comments (schema URL, provenance, etc.)
        File.write(path, preamble + "---\n" + collection.to_yaml.sub(/\A---\s*\n/, ""))
        stripped
      rescue => e
        warn "  FAIL #{File.basename(path)}: #{e.class}: #{e.message[0, 120]}"
        0
      end

      def strip_prefix_from(decision)
        return 0 unless decision.title&.any?
        stripped = 0
        decision.title.each do |ls|
          next unless ls.value
          new_value = ls.value.sub(PREFIX_RE, "")
          next if new_value == ls.value
          ls.value = new_value
          stripped += 1
        end
        stripped
      end

      def each_resolution_yaml
        Dir.glob(File.join(resolutions_dir, "*.yaml")).sort.each do |path|
          next if File.basename(path).start_with?("_")
          yield path
        end
      end
    end
  end
end

ResolutionsData::StripAgendaPrefixFromTitles.run

