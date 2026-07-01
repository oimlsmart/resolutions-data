#!/usr/bin/env ruby
# frozen_string_literal: true

# Validate every resolutions/*.yaml against the canonical Edoxen schema.
#
# Used by .github/workflows/deploy-pages.yml so a PR can't deploy unless
# every YAML is schema-compliant. The canonical schema is vendored at
# scripts/specs/schemas/edoxen.yaml (refreshed from metanorma/edoxen);
# override the path with the EDOXEN_SCHEMA env var if needed.

require "yaml"
begin
  require "json_schemer"
rescue LoadError
  warn "json_schemer is required. Install with: gem install json_schemer"
  exit 2
end

module ResolutionsData
  module Validate
    ROOT = File.expand_path("..", __dir__)
    DIR  = File.join(ROOT, "resolutions")

    def self.schema_path
      ENV["EDOXEN_SCHEMA"] ||
        File.join(ROOT, "scripts", "specs", "schemas", "edoxen.yaml")
    end

    def self.run
      schema_file = schema_path
      unless File.exist?(schema_file)
        abort("edoxen schema not found at #{schema_file}")
      end

      schema = YAML.safe_load(File.read(schema_file))
      schemer = JSONSchemer.schema(schema)

      files = Dir.glob(File.join(DIR, "*.yaml")).sort
      abort("no YAML files found under #{DIR}") if files.empty?

      bad = 0
      files.each do |f|
        begin
          data = YAML.safe_load(File.read(f), permitted_classes: [Date, Time, DateTime])
        rescue => e
          warn "  PARSE FAIL #{File.basename(f)}: #{e.message}"
          bad += 1
          next
        end

        errors = schemer.validate(data).to_a
        if errors.any?
          bad += 1
          warn "  SCHEMA FAIL #{File.basename(f)}: #{errors.size} error(s)"
          errors.first(3).each do |e|
            warn "    #{e['data_pointer']}: #{e['error']}"
          end
        end
      end

      total = files.size
      puts "Validated #{total} YAML files against #{File.basename(schema_file)}; #{bad} failure(s)."
      exit(bad.zero? ? 0 : 1)
    end
  end
end

ResolutionsData::Validate.run if $PROGRAM_NAME == __FILE__
