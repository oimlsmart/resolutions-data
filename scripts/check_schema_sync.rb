#!/usr/bin/env ruby
# frozen_string_literal: true

# Verify that every enum-list in schemas/edoxen-meeting.yaml matches the
# corresponding enum-list in the canonical edoxen gem's schema/meeting.yaml.
#
# The gem ships its own spec/edoxen/schema_meeting_enum_sync_spec.rb that
# asserts parity with Edoxen::Enums::*; this script is the data-side
# mirror — it asserts parity between OUR vendored copy and the gem's copy.
#
# Exits non-zero on any drift.

require "yaml"
require "open3"
require "tmpdir"

LOCAL_SCHEMA = File.expand_path("../schemas/edoxen-meeting.yaml", __dir__)

# Locate the gem's schema. Try several layouts: system gem install,
# bundler install (bundler/gems/<gem>-<sha>/), and sibling checkout at
# ~/src/edoxen/edoxen for local development.
def gem_schema_path
  out, = Open3.capture2("gem", "which", "edoxen")
  path = out.lines.first&.strip
  if path&.start_with?("/") && File.exist?(path)
    # lib/edoxen.rb is two levels below the gem root.
    gem_root = File.expand_path("../..", path)
    candidate = File.join(gem_root, "schema", "meeting.yaml")
    return candidate if File.exist?(candidate)
  end
  # Bundler layout: gems/<name>-<sha>/lib/edoxen.rb → up two.
  if path && path =~ %r{/bundler/gems/}
    gem_root = File.expand_path("../..", path)
    candidate = File.join(gem_root, "schema", "meeting.yaml")
    return candidate if File.exist?(candidate)
  end
  dev = File.expand_path("~/src/edoxen/edoxen/schema/meeting.yaml")
  return dev if File.exist?(dev)
  raise "gem schema not found (looked under #{path} and #{dev})"
end

# Walk a schema YAML hash and return { def_name => enum_array } for every
# $defs entry whose value has an `enum` key.
def extract_enums(schema)
  out = {}
  defs = schema["$defs"] || schema[:defs]
  return out unless defs.is_a?(Hash)
  defs.each do |name, node|
    next unless node.is_a?(Hash)
    if node["enum"].is_a?(Array)
      out[name] = node["enum"]
    end
  end
  out
end

local = YAML.safe_load(File.read(LOCAL_SCHEMA))
gem_path = gem_schema_path
gem = YAML.safe_load(File.read(gem_path))

local_enums = extract_enums(local)
gem_enums = extract_enums(gem)

drift = 0
(local_enums.keys | gem_enums.keys).sort.each do |name|
  l = local_enums[name]
  g = gem_enums[name]
  if l.nil?
    warn "  ONLY IN GEM: #{name} = #{g.inspect}"
    drift += 1
    next
  end
  if g.nil?
    warn "  ONLY LOCAL: #{name} = #{l.inspect}"
    drift += 1
    next
  end
  next if l == g
  warn "  DRIFT #{name}:"
  warn "    local = #{l.inspect}"
  warn "    gem   = #{g.inspect}"
  drift += 1
end

puts "Compared #{local_enums.size} local enum(s) against #{gem_enums.size} gem enum(s); #{drift} difference(s)."
exit(drift.zero? ? 0 : 1)
