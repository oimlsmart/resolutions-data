# frozen_string_literal: true

require "rake"
require "rake/testtask"

# Make the lib/ directory available to all scripts via $LOAD_PATH.
# Scripts that `require "oiml/resolutions_data"` work whether they're
# invoked from the repo root or via `bundle exec`.
$LOAD_PATH.unshift(File.expand_path("lib", __dir__))

task :default do
  sh "bundle exec rspec"
end

# Validate every YAML against the edoxen gem.
task :validate do
  sh "bundle exec edoxen validate-meetings 'meetings/*.yaml'"
  sh "bundle exec edoxen validate 'resolutions/*.yaml'"
  sh "bundle exec ruby scripts/check_schema_sync.rb"
  sh "bundle exec ruby scripts/check_meeting_join.rb"
  sh "ruby scripts/validate_yaml.rb"
end

desc "Rebuild browser data (npm run build-data)"
task :build do
  sh "node scripts/build-data.mjs", chdir: File.expand_path("browser", __dir__)
end
