#!/usr/bin/env ruby
# frozen_string_literal: true

# Validate every resolutions/*.yaml parses cleanly and has a `resolutions`
# array of well-formed entries. Exits non-zero on any failure.
#
# Resolution records follow the Edoxen schema: per-language content lives
# under `localizations[]` (one entry per available language), so we check
# that each resolution has at least one localization with a title.

require "yaml"

module ResolutionsData
  module Validate
    ROOT = File.expand_path("..", __dir__)
    DIR  = File.join(ROOT, "resolutions")

    # Resolution-level (language-agnostic) required fields.
    REQUIRED_RESOLUTION_FIELDS = %w[identifier].freeze
    # Each localization must carry at least a title.
    REQUIRED_LOCALIZATION_FIELDS = %w[language_code title].freeze
    # Metadata must carry either `title` (legacy single-language) or
    # `title_localized` (new merged-yaml form), plus dates/source.
    REQUIRED_METADATA_FIELDS = %w[source].freeze

    def self.run
      files = Dir.glob(File.join(DIR, "*.yaml")).sort
      abort("no YAML files found under #{DIR}") if files.empty?

      bad = 0
      files.each do |f|
        begin
          data = YAML.load_file(f)
        rescue => e
          warn "  PARSE FAIL #{File.basename(f)}: #{e.message}"
          bad += 1
          next
        end

        unless data.is_a?(Hash)
          warn "  SHAPE FAIL #{File.basename(f)}: top-level is #{data.class}, not Hash"
          bad += 1
          next
        end

        meta = data["metadata"]
        unless meta.is_a?(Hash)
          warn "  META FAIL  #{File.basename(f)}: no metadata Hash"
          bad += 1
        else
          REQUIRED_METADATA_FIELDS.each do |k|
            unless meta.key?(k)
              warn "  META FAIL  #{File.basename(f)}: missing metadata.#{k}"
              bad += 1
            end
          end
          unless meta.key?("title") || meta.key?("title_localized")
            warn "  META FAIL  #{File.basename(f)}: missing both metadata.title and metadata.title_localized"
            bad += 1
          end
        end

        decisions = data["decisions"]
        unless decisions.is_a?(Array)
          warn "  RES FAIL   #{File.basename(f)}: decisions is not an Array"
          bad += 1
          next
        end

        decisions.each_with_index do |r, i|
          REQUIRED_RESOLUTION_FIELDS.each do |k|
            unless r.is_a?(Hash) && r.key?(k)
              warn "  RES FAIL   #{File.basename(f)}[#{i}]: missing #{k}"
              bad += 1
            end
          end

          # v1.0 shape: per-field LocalizedString[] (title, subject,
          # message, considering). The canonical schema check is
          # `bundle exec edoxen validate`; this structural validator
          # only ensures each decision carries at least one title.
          unless r.is_a?(Hash) && r["title"].is_a?(Array) && !r["title"].empty?
            warn "  RES FAIL   #{File.basename(f)}[#{i}]: missing title LocalizedString[]"
            bad += 1
            next
          end
        end
      end

      total = files.size
      puts "Validated #{total} YAML files; #{bad} issue(s)."
      exit (bad.zero? ? 0 : 1)
    end
  end
end

ResolutionsData::Validate.run if $PROGRAM_NAME == __FILE__
