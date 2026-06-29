#!/usr/bin/env ruby
# frozen_string_literal: true

# Validate every resolutions/*.yaml parses cleanly and has a `resolutions` array
# of well-formed entries. Exits non-zero on any failure.

require "yaml"

module ResolutionsData
  module Validate
    ROOT = File.expand_path("..", __dir__)
    DIR  = File.join(ROOT, "resolutions")

    REQUIRED_RESOLUTION_FIELDS = %w[identifier subject title dates].freeze
    REQUIRED_METADATA_FIELDS   = %w[title dates source venue language].freeze

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
        end

        ress = data["resolutions"]
        unless ress.is_a?(Array)
          warn "  RES FAIL   #{File.basename(f)}: resolutions is not an Array"
          bad += 1
          next
        end

        ress.each_with_index do |r, i|
          REQUIRED_RESOLUTION_FIELDS.each do |k|
            unless r.is_a?(Hash) && r.key?(k)
              warn "  RES FAIL   #{File.basename(f)}[#{i}]: missing #{k}"
              bad += 1
            end
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
