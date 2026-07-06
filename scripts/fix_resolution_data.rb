# frozen_string_literal: true

# Three related fixes across all resolutions/*.yaml:
#
# 1. Set `agenda_item: '<label>'` on every decision that doesn't
#    already carry one. The label is derived from the trailing
#    segment of the identifier number (e.g. "CIML/2025/14.2" → "14.2",
#    "Conference/2004/9" → "9"). Acclamations are skipped.
#
# 2. Remove `subject: CIML` from Conference/2004/* localizations (it
#    was a parser mis-default). Also remove subject when it matches
#    the meeting body name verbatim (subject should be a real topic,
#    not a body echo).
#
# 3. Rewrite titles in the form "Agenda Item <N>: <agenda_item_title>"
#    by cross-referencing the decision's agenda_item with the meeting's
#    agenda YAML. Skips:
#      - decisions with no agenda_item (acclamations)
#      - decisions whose agenda_item is not in the meeting agenda
#      - titles that already start with "Agenda Item"
#
# Idempotent: re-running after a successful pass produces zero changes.

require "yaml"
$LOAD_PATH.unshift(File.expand_path("../lib", __dir__))
require "oiml/resolutions_data"

module ResolutionsData
  module FixResolutionData
    # Regex used to detect an already-formatted title (idempotency).
    # The placeholder "Agenda item N" (no agenda-title suffix) is NOT
    # considered formatted — we want to expand it to "Agenda Item N: <title>".
    ALREADY_FORMATTED_RE = /\AAgenda [Ii]tem\s[\d.]+:\s+\S/.freeze

    class << self
      # Allow tests to override the root directory via FIX_RESOLUTION_DATA_ROOT
      # environment variable. Production usage leaves this unset → defaults
      # to the parent of scripts/.
      def root_dir
        ENV["FIX_RESOLUTION_DATA_ROOT"] || File.expand_path("..", __dir__)
      end

      def resolutions_dir
        File.join(root_dir, "resolutions")
      end

      def agendas_dir
        File.join(root_dir, "agendas")
      end

      def run
        changed_files = 0
        each_resolution_yaml do |path|
          changed = process_file(path)
          changed_files += 1 if changed
        end
        puts "Fixed #{changed_files} resolution YAML(s)."
      end

      def process_file(path)
        raw = File.read(path)
        segments = raw.split(/^---\s*$/, 3)
        return false if segments.size < 2

        preamble = segments[0].to_s
        data = YAML.safe_load(segments[1], permitted_classes: [Date, Time, DateTime]) || {}
        meeting_slug = meeting_slug_from_metadata(data["metadata"])

        agendas_by_label = load_agenda_titles(meeting_slug)
        return false if agendas_by_label.nil? && data["metadata"].is_a?(Hash) && data["metadata"]["meeting_urn"]

        changed = false
        body = data["metadata"] && data["metadata"]["source"] ? body_from_source(data["metadata"]["source"]) : nil

        (data["decisions"] || []).each do |decision|
          changed |= fix_decision(decision, agendas_by_label || {}, body)
        end

        return false unless changed

        out = preamble + "---\n" + YAML.dump(data).sub(/\A---\s*\n/, "")
        File.write(path, out)
        true
      end

      def load_agenda_titles(meeting_slug)
        return nil unless meeting_slug
        path = File.join(agendas_dir, "#{meeting_slug}.yaml")
        return nil unless File.file?(path)

        data = YAML.safe_load(File.read(path))
        titles = {}
        (data && data["items"] || []).each do |item|
          label = item["label"].to_s
          title = item["title"].to_s.strip
          next if label.empty? || title.empty?
          titles[label] = title
        end
        titles
      end

      def each_resolution_yaml
        Dir.glob(File.join(resolutions_dir, "*.yaml")).sort.each do |path|
          next if File.basename(path).start_with?("_")
          yield path
        end
      end

      def meeting_slug_from_metadata(metadata)
        return nil unless metadata.is_a?(Hash)
        urn = metadata["meeting_urn"].to_s
        return nil if urn.empty?
        m = urn.match(/:meeting:([-\w]+)\z/)
        m ? m[1] : nil
      end

      def body_from_source(source)
        s = String(source).downcase
        return "conference" if s.include?("conference")
        return "dc" if s.include?("development council")
        "ciml"
      end

      def fix_decision(decision, agenda_titles, body)
        changed = false
        agenda_item = derive_agenda_item(decision)
        if agenda_item && decision["agenda_item"].nil?
          decision["agenda_item"] = agenda_item
          changed = true
        elsif decision["agenda_item"].nil?
          agenda_item = nil
        else
          agenda_item = decision["agenda_item"]
        end

        (decision["localizations"] || []).each do |loc|
          changed |= fix_localization(loc, agenda_item, agenda_titles, body)
        end

        changed
      end

      def derive_agenda_item(decision)
        idents = decision["identifier"] || []
        idents.each do |ident|
          next unless ident.is_a?(Hash)
          parsed = Oiml::ResolutionsData::IdentifierParser.parse("#{ident['prefix']}/#{ident['number']}")
          next unless parsed
          return parsed.agenda_label
        end
        nil
      end

      def fix_localization(loc, agenda_item, agenda_titles, body)
        changed = false

        if (subject = loc["subject"])
          if subject == "CIML" || subject_matches_body?(subject, body)
            loc.delete("subject")
            changed = true
          end
        end

        title = loc["title"].to_s
        return changed if title.empty?
        return changed if title =~ ALREADY_FORMATTED_RE

        agenda_title = agenda_item ? agenda_titles[agenda_item] : nil
        return changed unless agenda_title

        loc["title"] = "Agenda Item #{agenda_item}: #{agenda_title}"
        true | changed
      end

      def subject_matches_body?(subject, body)
        return false unless body
        case body
        when "conference" then subject.to_s == "Conference"
        when "dc" then subject.to_s == "Development Council"
        when "ciml" then subject.to_s == "CIML"
        else false
        end
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
