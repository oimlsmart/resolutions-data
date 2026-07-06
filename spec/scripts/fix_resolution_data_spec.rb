# frozen_string_literal: true

require "spec_helper"
require "tmpdir"
require "fileutils"
require "yaml"
require "open3"

# Integration spec for scripts/fix_resolution_data.rb — verifies the
# three fixes (agenda_item, subject, title format) and idempotency.
#
# The script reads its root directory from the FIX_RESOLUTION_DATA_ROOT
# env var (falling back to the repo root). We point it at a temp dir,
# write a synthetic resolution + agenda, run the script, and assert
# the expected transformations.
RSpec.describe "fix_resolution_data integration" do
  let(:tmp_root) { Dir.mktmpdir }
  let(:resolutions_dir) { File.join(tmp_root, "resolutions") }
  let(:agendas_dir) { File.join(tmp_root, "agendas") }

  let(:agenda_yaml) do
    { "items" => [{ "label" => "9", "title" => "Other business" }] }.to_yaml
  end

  let(:resolution_yaml) do
    <<~YAML
      ---
      metadata:
        source: OIML Conference Secretariat
        meeting_urn: urn:oiml:conference:meeting:conference-12
      decisions:
      - identifier:
        - prefix: Conference
          number: 2004/9
        doi: 10.63493/resolutions/conf200409
        urn: urn:oiml:doc:conf:resolution:12.09
        dates:
        - date: '2004-10-26'
          type: decided
        localizations:
        - language_code: eng
          title: Other business
          subject: CIML
          considerations: []
          actions: []
    YAML
  end

  before do
    FileUtils.mkdir_p([resolutions_dir, agendas_dir])
    File.write(File.join(agendas_dir, "conference-12.yaml"), agenda_yaml)
    File.write(File.join(resolutions_dir, "conference-12-decisions.yaml"), resolution_yaml)
  end

  after { FileUtils.rm_rf(tmp_root) }

  def run_script
    repo_root = File.expand_path("../..", __dir__)
    script = File.join(repo_root, "scripts", "fix_resolution_data.rb")
    env = { "FIX_RESOLUTION_DATA_ROOT" => tmp_root }
    output, status = Open3.capture2(env, "ruby", "-I#{File.join(repo_root, 'lib')}", script)
    raise "script failed: #{output}" unless status.success?

    output
  end

  def reload_resolution
    path = File.join(resolutions_dir, "conference-12-decisions.yaml")
    YAML.safe_load(File.read(path))
  end

  it "sets agenda_item from the identifier" do
    run_script
    expect(reload_resolution["decisions"].first["agenda_item"]).to eq("9")
  end

  it "removes the wrong subject" do
    run_script
    expect(reload_resolution["decisions"].first["localizations"].first.key?("subject")).to be(false)
  end

  it "rewrites the title to include 'Agenda Item N: '" do
    run_script
    expect(reload_resolution["decisions"].first["localizations"].first["title"]).to eq("Agenda Item 9: Other business")
  end

  it "is idempotent (running twice produces no further changes)" do
    run_script
    content_after_first = File.read(File.join(resolutions_dir, "conference-12-decisions.yaml"))
    run_script
    content_after_second = File.read(File.join(resolutions_dir, "conference-12-decisions.yaml"))
    expect(content_after_second).to eq(content_after_first)
  end
end
