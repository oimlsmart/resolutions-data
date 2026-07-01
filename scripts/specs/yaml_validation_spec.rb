# frozen_string_literal: true

# L1 test layer — every YAML in resolutions/ validates against the
# Edoxen schema. See TODO.complete/22-specs.md.
#
# Run:    bundle exec rspec scripts/specs/yaml_validation_spec.rb
# Or via: npm run validate  (once package.json wires it up)

require "json_schemer"
require "yaml"

RSpec.describe "Edoxen schema validation" do
  let(:schema_path) do
    ENV["EDOXEN_SCHEMA"] ||
      File.expand_path("../../../../mn/edoxen/schema/edoxen.yaml", __dir__)
  end
  let(:schema) do
    raise "Edoxen schema not found at #{schema_path}" unless File.exist?(schema_path)
    YAML.safe_load(File.read(schema_path))
  end
  let(:schemer) { JSONSchemer.schema(schema) }

  def resolution_files
    Dir[File.expand_path("../../resolutions/*.yaml", __dir__)].reject do |p|
      File.basename(p).start_with?("_")
    end
  end

  it "the Edoxen schema is loadable" do
    expect(schema).to be_a(Hash)
    expect(schema["properties"]).to be_a(Hash)
  end

  it "has at least one resolution file to validate" do
    expect(resolution_files.size).to be > 0
  end

  # Snapshot the file list once at require time so RSpec can iterate
  # over it to declare per-file examples.
  RESOLUTION_FILES = Dir[File.expand_path("../../resolutions/*.yaml", __dir__)].reject do |p|
    File.basename(p).start_with?("_")
  end

  RESOLUTION_FILES.each do |path|
    it "#{File.basename(path)} validates" do
      data = YAML.safe_load(File.read(path))
      errors = schemer.validate(data).to_a
      expect(errors).to be_empty,
        "#{File.basename(path)} had #{errors.size} validation errors:\n" +
        errors.first(5).map { |e| "  #{e['data_pointer']}: #{e['error']}" }.join("\n")
    end
  end
end
