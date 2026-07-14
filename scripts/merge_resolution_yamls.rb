#!/usr/bin/env ruby
# frozen_string_literal: true

# Merge per-language DecisionCollection YAMLs into one per meeting,
# folding each language's per-field LocalizedString[] entries into
# the canonical v1.0 shape.
#
# Input (one YAML per (meeting, language)):
#   resolutions/ciml-44-resolutions-en.yaml
#   resolutions/ciml-44-resolutions-fr.yaml
#
# Output (one YAML per meeting) in v1.0 per-field LocalizedString shape:
#   resolutions/ciml-44-resolutions.yaml
#
# The merge:
#   - metadata.title LocalizedString[]: union of per-language titles.
#   - per-decision title/subject/message/considering LocalizedString[]:
#     union of per-language values, keyed by spelling.
#   - actions/considerations/approvals: dedupe by (type, date_effective.date)
#     and union their message LocalizedString[] across languages.
#
# All file I/O goes through Edoxen::DecisionCollection.from_yaml /
# to_yaml — no raw Hash manipulation.

require "edoxen"
$LOAD_PATH.unshift(File.expand_path("../lib", __dir__))

ROOT = File.expand_path("..", __dir__)
DIR  = File.join(ROOT, "resolutions")

module ResolutionsData
  module MergeResolutionYamls
    class << self
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

      def run
        files = Dir.glob(File.join(DIR, "*.yaml")).reject { |p| File.basename(p).start_with?("_") }

        per_lang_files = files.select { |p| File.basename(p, ".yaml") =~ /\A(.*)-(en|fr)\z/ }
        by_collection = Hash.new { |h, k| h[k] = { files: [], langs: [] } }
        per_lang_files.each do |path|
          slug, lang_suffix = split_collection_slug(path)
          by_collection[slug][:files] << path
          by_collection[slug][:langs] << lang_for_collection(slug, lang_suffix)
        end

        merged_count = 0
        by_collection.each do |slug, info|
          merge_one(slug, info)
          merged_count += 1
        end
        puts "Merged into #{merged_count} YAML file(s)."
      end

      def merge_one(slug, info)
        parsed = info[:files].map do |path|
          [path, Edoxen::DecisionCollection.from_yaml(File.read(path))]
        end

        merged_titles = []
        parsed.each do |(path, dc)|
          _, lang_suffix = split_collection_slug(path)
          lang = lang_for_collection(slug, lang_suffix)
          dc.metadata&.title&.each do |ls|
            merged_titles << Edoxen::LocalizedString.new(spelling: lang, value: ls.value)
          end
        end

        by_key = {}
        parsed.each do |(path, dc)|
          _, lang_suffix = split_collection_slug(path)
          lang = lang_for_collection(slug, lang_suffix)
          dc.decisions.each do |dec|
            key = dec.identifier.map { |i| "#{i.prefix}/#{i.number}" }.join(" / ")
            by_key[key] ||= {}
            by_key[key][lang] = dec
          end
        end

        merged_decisions = by_key.keys.sort.map { |k| merge_decision(by_key[k]) }

        base_dc = parsed.first.last
        merged_meta = Edoxen::DecisionMetadata.new
        merged_meta.source = base_dc.metadata&.source
        merged_meta.meeting_urn = base_dc.metadata&.meeting_urn
        merged_meta.city = base_dc.metadata&.city
        merged_meta.country_code = base_dc.metadata&.country_code
        merged_meta.title = merged_titles if merged_titles.any?

        merged = Edoxen::DecisionCollection.new(
          metadata: merged_meta,
          decisions: merged_decisions,
        )

        out_path = File.join(DIR, "#{slug}.yaml")
        preamble = "---\n# Merged by scripts/merge_resolution_yamls.rb from:\n#   #{info[:files].map { |p| File.basename(p) }.join(', ')}\n"
        File.write(out_path, preamble + merged.to_yaml.sub(/\A---\s*\n/, ""))

        info[:files].each { |p| File.delete(p) if File.exist?(p) && p != out_path }
        puts "  merged → #{slug}.yaml (#{merged_decisions.size} decisions)"
      end

      # Merge per-language variants of one Decision. Unions each
      # per-field LocalizedString[] across languages and combines
      # actions/considerations/approvals by (type, date).
      def merge_decision(lang_map)
        base = lang_map.values.first
        Edoxen::Decision.new(
          identifier: base.identifier,
          kind: base.kind,
          status: base.status,
          doi: base.doi,
          urn: base.urn,
          agenda_item: base.agenda_item,
          dates: base.dates,
          categories: base.categories,
          title: union_localized(lang_map, :title),
          subject: union_localized(lang_map, :subject),
          message: union_localized(lang_map, :message),
          considering: union_localized(lang_map, :considering),
          actions: merge_action_like(lang_map, :actions, Edoxen::Action),
          considerations: merge_action_like(lang_map, :considerations, Edoxen::Consideration),
          approvals: merge_action_like(lang_map, :approvals, Edoxen::Approval),
        )
      end

      def union_localized(lang_map, attr_name)
        out = []
        lang_map.each do |lang, dec|
          vals = dec.public_send(attr_name)
          next unless vals&.any?
          vals.each do |ls|
            out << Edoxen::LocalizedString.new(spelling: lang, value: ls.value)
          end
        end
        out
      end

      def merge_action_like(lang_map, attr_name, model_class)
        grouped = {}
        order = []
        lang_map.each do |lang, dec|
          items = dec.public_send(attr_name)
          next unless items
          items.each do |item|
            key = [item.type, item.date_effective&.date&.to_s]
            unless grouped.key?(key)
              grouped[key] = {}
              order << key
            end
            msg_val = item.message&.first&.value
            grouped[key][lang] = msg_val if msg_val
          end
        end

        order.map do |key|
          type, _date = key
          messages = grouped[key].map do |lang, val|
            Edoxen::LocalizedString.new(spelling: lang, value: val)
          end
          params = {}
          params[:type] = type
          params[:message] = messages
          model_class.new(params)
        end
      end
    end
  end
end

ResolutionsData::MergeResolutionYamls.run
