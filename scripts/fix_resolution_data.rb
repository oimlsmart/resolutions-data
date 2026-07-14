#!/usr/bin/env ruby
# frozen_string_literal: true

# Three related fixes applied directly to v1.0 Edoxen::DecisionCollection
# model instances (no raw Hash manipulation):
#
# 1. Set `agenda_item` on every Decision that doesn't carry one,
#    derived from the trailing segment of the identifier number
#    (e.g. "CIML/2025/14.2" → "14.2"). Acclamations skipped.
#
# 2. Strip a `subject` LocalizedString whose value merely echoes the
#    meeting body name ("CIML", "Conference", "Development Council").
#
# 3. Rewrite title LocalizedStrings from "<X>" or "Agenda item <X>"
#    to "Agenda Item <X>: <agenda_item_title>" by cross-referencing
#    the meeting's Agenda YAML.
#
# Idempotent: re-running after a successful pass produces no further
# changes. Set FIX_RESOLUTION_DATA_ROOT to override the repo root
# (used by specs).

require "yaml"
$LOAD_PATH.unshift(File.expand_path("../lib", __dir__))
require "oiml/resolutions_data"

module ResolutionsData
  module FixResolutionData
    ALREADY_FORMATTED_RE = /\AAgenda [Ii]tem\s[\d.]+:\s+\S/.freeze

    class << self
      def root_dir
        ENV["FIX_RESOLUTION_DATA_ROOT"] || File.expand_path("../..", __dir__)
      end

      def resolutions_dir
        File.join(root_dir, "resolutions")
      end

      def agendas_dir
        File.join(root_dir, "agendas")
      end

      def run
        require "edoxen"
        changed_files = 0
        each_resolution_yaml do |path|
          changed = process_file(path)
          changed_files += 1 if changed
        end
        puts "Fixed #{changed_files} resolution YAML(s)."
      end

      def process_file(path)
        require "edoxen"
        raw = File.read(path)
        segments = raw.split(/^---\s*$/, 3)
        return false if segments.size < 2

        preamble = segments[0].to_s
        collection = Edoxen::DecisionCollection.from_yaml(segments[1])
        meeting_slug = meeting_slug_from_metadata(collection.metadata)
        agendas_by_label = load_agenda_titles(meeting_slug)
        body = body_from_source(collection.metadata&.source)

        changed = false
        collection.decisions.each do |decision|
          changed |= fix_decision(decision, agendas_by_label || {}, body)
        end
        return false unless changed

        # Preserve the preamble comments (schema URL, provenance, etc.)
        # and write the mutated collection back.
        File.write(path, preamble + "---\n" + collection.to_yaml.sub(/\A---\s*\n/, ""))
        true
      rescue => e
        warn "  FAIL #{File.basename(path)}: #{e.class}: #{e.message[0, 100]}"
        false
      end

      # ---- helpers ----

      def load_agenda_titles(meeting_slug)
        return nil unless meeting_slug
        path = File.join(agendas_dir, "#{meeting_slug}.yaml")
        return nil unless File.file?(path)

        data = YAML.safe_load(File.read(path))
        titles = {}
        items = data && (data["items"] || (data["agenda"] && data["agenda"]["items"]))
        items&.each do |item|
          label = item["label"].to_s
          title = extract_agenda_item_title(item)
          next if label.empty? || title.empty?
          titles[label] = title
        end
        titles
      end

      # Agenda items in v1.0 carry `title: [{spelling, value}]`. Older
      # agendas might still have a plain string. Accept both.
      def extract_agenda_item_title(item)
        t = item["title"]
        return "" unless t
        return t.to_s if t.is_a?(String)
        return t.first["value"].to_s if t.is_a?(Array) && t.first.is_a?(Hash)
        ""
      end

      def meeting_slug_from_metadata(metadata)
        return nil unless metadata&.meeting_urn
        m = metadata.meeting_urn.match(/:meeting:([-\w]+)\z/)
        m ? m[1] : nil
      end

      def body_from_source(source)
        s = String(source || "").downcase
        return "conference" if s.include?("conference")
        return "dc" if s.include?("development council")
        "ciml"
      end

      def fix_decision(decision, agenda_titles, body)
        require "edoxen"
        changed = false

        # 1. agenda_item
        if decision.agenda_item.nil? || decision.agenda_item.to_s.empty?
          derived = derive_agenda_item(decision)
          if derived
            decision.agenda_item = derived
            changed = true
          end
        end
        agenda_item = decision.agenda_item&.to_s

        # 2. subject echo strip
        if decision.subject&.any?
          original = decision.subject.dup
          decision.subject = decision.subject.reject { |ls| subject_echoes_body?(ls.value, body) }
          if decision.subject.size != original.size
            decision.subject = [] if decision.subject.empty?
            changed = true
          end
        end

        # 3. title rewrite
        return changed unless agenda_item && decision.title&.any?

        decision.title.each do |ls|
          next if formatted?(ls.value)
          agenda_title = lookup_agenda_title(agenda_item, agenda_titles)
          next unless agenda_title
          old = ls.value
          ls.value = "Agenda Item #{agenda_item}: #{agenda_title}"
          changed = true if ls.value != old
        end
        changed
      end

      def derive_agenda_item(decision)
        decision.identifier.each do |ident|
          parsed = Oiml::ResolutionsData::IdentifierParser.parse("#{ident.prefix}/#{ident.number}")
          next unless parsed
          return parsed.agenda_label
        end
        nil
      end

      def formatted?(value)
        value.to_s =~ ALREADY_FORMATTED_RE
      end

      def subject_echoes_body?(value, body)
        # Always strip the legacy "CIML" subject — it was a parser
        # mis-default that leaked into Conference/DC decisions.
        return true if value.to_s == "CIML"
        return false unless body
        case body
        when "conference" then value.to_s == "Conference"
        when "dc" then value.to_s == "Development Council"
        else false
        end
      end

      def lookup_agenda_title(label, agenda_titles)
        return nil unless label
        l = label.to_s
        until l.empty?
          return agenda_titles[l] if agenda_titles.key?(l)
          idx = l.rindex(".")
          break unless idx
          l = l[0...idx]
        end
        agenda_titles[label.to_s]
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

ResolutionsData::FixResolutionData.run
