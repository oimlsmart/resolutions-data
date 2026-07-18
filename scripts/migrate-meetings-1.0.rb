#!/usr/bin/env ruby
# frozen_string_literal: true

# Migrate edoxen-data/meetings/*.yaml to the edoxen 1.0 Meeting schema
# (canonical: edoxen-model/schema/meeting.yaml, gem edoxen 0.8.2).
#
# Text-surgical (no YAML round-trip of whole files) and idempotent:
# re-running changes nothing. Transforms:
#
# 1. `committee:` scalar/empty → inline Body {code, name[LocalizedString]}
#    - "International Committee of Legal Metrology (CIML)" (and the 6
#      empty `committee:` lines in early CIML skeletons) → CIML Body
#    - "International Conference of Legal Metrology" → Conference Body
# 2. Agenda item `title:` scalar → Localized array
#    `[{spelling: eng, value: ...}]` (only inside the `agenda:` block;
#    meeting-level and decision-level titles are already Localized).
#    Multi-line folded scalars are consumed and re-emitted single-line.
# 3. `decisions:` embedded full Decision objects → StructuredIdentifier
#    refs `{prefix, number}` from each decision's identifier[0].
#    SAFETY: every extracted ref must resolve as identifier[0] of a
#    decision in some resolutions/*.yaml collection; otherwise the
#    file's decisions block is left untouched and reported (ABORT).
# 4. `type: conference_session` → `type: conference` (1.0 enum).
# 5. Drop empty (null) optional keys: city, country_code, general_area.
# 6. Drop minutes `script: Latn` (1.0 Minutes keeps only `spelling`).
# 7. Virtual venue `name:` scalar → Localized array.
# 8. source_urls `kind: resolutions_pdf` → `kind: decisions_pdf`
#    (1.0 SourceUrlKind enum; resolutions → decisions rename).
#
# Run: ruby scripts/migrate-meetings-1.0.rb
# Verify afterwards with:
#   bundle exec edoxen validate-meetings "edoxen-data/meetings/*.yaml"

require "yaml"

ROOT = File.expand_path("..", __dir__)
MEETINGS_DIR = File.join(ROOT, "edoxen-data", "meetings")
RESOLUTIONS_DIR = File.join(ROOT, "resolutions")

CIML_BODY = <<~YAML.chomp
  committee:
    code: CIML
    name:
    - spelling: eng
      value: International Committee of Legal Metrology (CIML)
    - spelling: fra
      value: Comité international de métrologie légale (CIML)
YAML

CONFERENCE_BODY = <<~YAML.chomp
  committee:
    code: OIML Conference
    name:
    - spelling: eng
      value: International Conference of Legal Metrology
    - spelling: fra
      value: Conférence internationale de métrologie légale
YAML

# Emit a Ruby string as a single-line YAML scalar (quoted iff needed).
# line_width: -1 disables Psych's default 80-column folding so the
# scalar always fits on one line.
def yaml_scalar(str)
  Psych.dump(str, line_width: -1).sub(/\A---\s?/, "").chomp
end

# identifier[0] {prefix, number} of every decision in resolutions/*.yaml,
# used by the decisions-transform safety check (nothing may be lost).
def resolution_refs
  @resolution_refs ||= begin
    refs = {}
    Dir.glob(File.join(RESOLUTIONS_DIR, "*.yaml")).sort.each do |path|
      data = YAML.safe_load(File.read(path), permitted_classes: [Date, Time])
      (data["decisions"] || []).each do |d|
        id = (d["identifier"] || []).first
        next unless id

        refs[[id["prefix"].to_s, id["number"].to_s]] ||= File.basename(path)
      end
    end
    refs
  end
end

# Parse the embedded decisions of one meeting file's decisions region
# into [{prefix, number}]. Returns nil when the region is not an array
# of full Decision objects (already refs, or empty).
def embedded_decision_refs(region_yaml)
  decisions = YAML.safe_load(region_yaml, permitted_classes: [Date, Time])
  return nil unless decisions.is_a?(Array)
  return nil if decisions.empty?
  return nil unless decisions.all? { |d| d.is_a?(Hash) && d["identifier"].is_a?(Array) }

  decisions.map do |d|
    id = d["identifier"].first
    { "prefix" => id["prefix"].to_s, "number" => id["number"].to_s }
  end
end

stats = Hash.new(0)
aborted = {}

Dir.glob(File.join(MEETINGS_DIR, "*.yaml")).sort.each do |path|
  lines = File.read(path).split("\n", -1)
  out = []
  i = 0
  in_agenda = false
  file_counts = Hash.new(0)

  while i < lines.size
    line = lines[i]

    # Track the agenda block (top-level `agenda:` .. next top-level key).
    in_agenda = true if line =~ /^agenda:/
    in_agenda = false if line =~ /^[a-z_]+:/ && line !~ /^agenda:/

    case line
    when /^committee: International Committee of Legal Metrology \(CIML\)\s*$/
      out << CIML_BODY
      file_counts[:committee] += 1
    when /^committee: International Conference of Legal Metrology\s*$/
      out << CONFERENCE_BODY
      file_counts[:committee] += 1
    when /^committee:\s*$/
      # Empty (null) committee in early CIML skeletons — unless already
      # transformed (next line is the Body's `code:`).
      if lines[i + 1] =~ /^  code:/
        out << line
      else
        out << CIML_BODY
        file_counts[:committee] += 1
      end
    when /^type: conference_session\s*$/
      out << "type: conference"
      file_counts[:type] += 1
    when /^  kind: resolutions_pdf\s*$/
      out << "  kind: decisions_pdf"
      file_counts[:source_url_kind] += 1
    when /^(city|country_code|general_area):\s*$/
      # Drop empty (null) optional keys — schema wants string/array.
      # The key is null only when nothing (or another top-level key)
      # follows; an indented value or a same-indent `- ` sequence entry
      # means the key has content and must be kept.
      nxt = lines[i + 1]
      if nxt.nil? || nxt.strip.empty? || nxt =~ /^[a-z_]+:/
        file_counts[:null_keys] += 1
      else
        out << line
      end
    when /^  script: Latn\s*$/
      # 1.0 Minutes keeps only `spelling`.
      file_counts[:minutes_script] += 1
    when /^  name: (.+)$/
      # Virtual venue name scalar → Localized array (only right after
      # `- kind: virtual`; anything else is left alone).
      name_raw = Regexp.last_match(1)
      if out.last =~ /^- kind: virtual\s*$/
        out << "  name:"
        out << "  - spelling: eng"
        out << "    value: #{yaml_scalar(YAML.safe_load("k: #{name_raw}")["k"])}"
        file_counts[:venue_name] += 1
      else
        out << line
      end
    when /^    title: (.+)$/
      # Agenda item title scalar → Localized array. Only inside agenda.
      unless in_agenda
        out << line
        i += 1
        next
      end

      raw = Regexp.last_match(1)
      # Consume folded-scalar continuation lines (indent > 4).
      while i + 1 < lines.size && lines[i + 1] =~ /^ {5,}\S/
        i += 1
        raw += "\n#{lines[i]}"
      end
      value = YAML.safe_load("k: #{raw}")["k"]
      out << "    title:"
      out << "    - spelling: eng"
      out << "      value: #{yaml_scalar(value)}"
      file_counts[:agenda_titles] += 1
    when /^decisions: (.+)$/
      # decisions: [] — already valid, leave alone.
      out << line
    when /^decisions:$/
      # Whole region up to the next top-level key (or EOF).
      region = []
      while i + 1 < lines.size && lines[i + 1] !~ /^[a-z_]+:/
        i += 1
        region << lines[i]
      end

      if region.first =~ /^- prefix:/
        # Already StructuredIdentifier refs — idempotent skip.
        out << line
        out.concat(region)
      else
        refs = embedded_decision_refs(region.join("\n"))
        if refs.nil?
          # Empty or unexpected shape — leave untouched.
          out << line
          out.concat(region)
        else
          missing = refs.reject { |r| resolution_refs.key?([r["prefix"], r["number"]]) }
          if missing.any?
            # SAFETY ABORT: refs with no decision in resolutions/*.yaml
            # would lose data — keep the embedded block, report the file.
            aborted[File.basename(path)] = missing
            out << line
            out.concat(region)
          else
            out << line
            refs.each do |r|
              out << "- prefix: #{yaml_scalar(r["prefix"])}"
              out << "  number: #{yaml_scalar(r["number"])}"
            end
            file_counts[:decisions_blocks] += 1
            file_counts[:decision_refs] += refs.size
          end
        end
      end
    else
      out << line
    end

    i += 1
  end

  next if file_counts.empty?

  File.write(path, out.join("\n"))
  file_counts.each { |k, v| stats[k] += v }
  puts format("%-22s %s", File.basename(path),
              file_counts.map { |k, v| "#{k}=#{v}" }.join(" "))
end

puts "\n== Migration summary =="
puts "files with committee→Body:      #{stats[:committee]}"
puts "agenda item titles localized:   #{stats[:agenda_titles]}"
puts "decisions blocks → refs:        #{stats[:decisions_blocks]} (#{stats[:decision_refs]} refs)"
puts "type conference_session fixed:  #{stats[:type]}"
puts "source_urls kind → decisions_pdf: #{stats[:source_url_kind]}"
puts "empty optional keys dropped:    #{stats[:null_keys]}"
puts "minutes script: lines dropped:  #{stats[:minutes_script]}"
puts "virtual venue names localized:  #{stats[:venue_name]}"

if aborted.any?
  puts "\n== SAFETY ABORTS (decisions left embedded) =="
  aborted.each do |file, missing|
    puts "#{file}: #{missing.size} ref(s) missing from resolutions/*.yaml:"
    missing.each { |m| puts "  - #{m["prefix"]} #{m["number"]}" }
  end
end

# --- Verification pass ----------------------------------------------------
# Re-parse every file and assert the 1.0 invariants; also re-check that no
# decisions ref dangles (every ref resolves in resolutions/*.yaml).
puts "\n== Verification =="
problems = []
total_refs = 0
Dir.glob(File.join(MEETINGS_DIR, "*.yaml")).sort.each do |path|
  data = YAML.safe_load(File.read(path), permitted_classes: [Date, Time])
  name = File.basename(path)

  committee = data["committee"]
  unless committee.is_a?(Hash) && committee["code"] && committee["name"].is_a?(Array)
    problems << "#{name}: committee is not an inline Body"
  end

  ((data["agenda"] || {})["items"] || []).each_with_index do |item, idx|
    unless item["title"].is_a?(Array)
      problems << "#{name}: agenda item #{idx} title is not a Localized array"
    end
  end

  decisions = data["decisions"] || []
  next if aborted.key?(name)

  decisions.each do |ref|
    keys = ref.is_a?(Hash) ? ref.keys.sort : []
    unless keys == %w[number prefix]
      problems << "#{name}: decisions entry is not a StructuredIdentifier ref: #{ref.inspect[0, 80]}"
      next
    end
    total_refs += 1
    unless resolution_refs.key?([ref["prefix"].to_s, ref["number"].to_s])
      problems << "#{name}: DANGLING decisions ref #{ref["prefix"]} #{ref["number"]}"
    end
  end
end

if problems.empty?
  puts "all 1.0 invariants hold; #{total_refs} decisions refs all resolve in resolutions/*.yaml"
else
  problems.each { |p| puts "PROBLEM: #{p}" }
  exit 1
end
