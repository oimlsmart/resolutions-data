#!/usr/bin/env ruby
# frozen_string_literal: true

# Scan OCR cover pages for the meeting date and update scripts/manifest.yaml
# with `date_start` and `date_end` (ISO 8601). Idempotent.

require "yaml"
require "fileutils"

module ResolutionsData
  module ExtractDates
    ROOT      = File.expand_path("..", __dir__)
    MANIFEST  = File.join(__dir__, "manifest.yaml")
    OCR_DIR   = File.join(ROOT, "reference-docs", "ocr", "md")

    MONTHS_EN = %w[January February March April May June July
                  August September October November December].freeze
    MONTHS_FR = %w[janvier février mars avril mai juin juillet
                  août septembre octobre novembre décembre].freeze
    MONTH_INDEX = Hash.new.tap do |h|
      MONTHS_EN.each_with_index { |name, i| h[name.downcase] = i }
      MONTHS_FR.each_with_index { |name, i| h[name.downcase] = i }
    end.freeze
    MONTH_RE = (MONTHS_EN + MONTHS_FR.map(&:capitalize)).uniq.join("|")

    # Returns [start_iso, end_iso] or nil.
    def self.extract_from_markdown(md)
      head = md.lines.first(60).join(" ")

      # 1. Range: "DD-DD Month YYYY" / "DD & DD Month YYYY" / "DD and DD Month YYYY"
      re1 = /(\d{1,2})\s*(?:[-–&]|and)\s*(\d{1,2})\s+(#{MONTH_RE})\s+(\d{4})/i
      if (m = head.match(re1))
        return build_range($1.to_i, $2.to_i, $3, $4.to_i)
      end

      # 2. Single date: "DD Month YYYY"
      re2 = /(\d{1,2})\s+(#{MONTH_RE})\s+(\d{4})/i
      if (m = head.match(re2))
        return build_single($1.to_i, $2, $3.to_i)
      end

      nil
    end

    def self.month_index(month_name)
      MONTH_INDEX[month_name.downcase] or raise "unknown month \#{month_name}"
    end

    def self.build_range(start_d, end_d, month_name, year)
      mo = month_index(month_name) + 1
      ["#{year}-#{pad(mo)}-#{pad(start_d)}", "#{year}-#{pad(mo)}-#{pad(end_d)}"]
    end

    def self.build_single(day, month_name, year)
      mo = month_index(month_name) + 1
      iso = "#{year}-#{pad(mo)}-#{pad(day)}"
      [iso, iso]
    end

    def self.pad(n) = n.to_s.rjust(2, "0")

    def self.run
      data = YAML.safe_load(File.read(MANIFEST), permitted_classes: [Date, Symbol])
      sources = data["sources"]
      stats = { updated: 0, unchanged: 0, missing: 0 }

      sources.each do |src|
        slug = src["slug"]
        # For bilingual PDFs, the date is in the OCR; we just need the EN side
        md_path = File.join(OCR_DIR, "#{slug}.md")
        unless File.exist?(md_path)
          warn "  no OCR for #{slug}"
          stats[:missing] += 1
          next
        end

        dates = extract_from_markdown(File.read(md_path))
        if dates.nil?
          warn "  no date found in OCR cover for #{slug}"
          stats[:missing] += 1
          next
        end

        start_iso, end_iso = dates
        existing = [src["date_start"], src["date_end"]]
        if existing == [start_iso, end_iso]
          stats[:unchanged] += 1
        else
          src["date_start"] = start_iso
          src["date_end"]   = end_iso
          stats[:updated] += 1
          puts "  #{slug}: #{start_iso} → #{end_iso}"
        end
      end

      # Rewrite the manifest preserving the inline-flow style
      File.write(MANIFEST, render_yaml(data))
      puts
      puts "Summary: #{stats[:updated]} updated, #{stats[:unchanged]} unchanged, #{stats[:missing]} missing"
      exit 1 if stats[:missing] > 0
    end

    # Render the manifest back to YAML keeping the one-line-per-source style.
    def self.render_yaml(data)
      out = []
      out << "# Curated manifest of OIML resolution / decision PDFs."
      out << "# Source: https://www.oiml.org/{en,fr}/structure/{ciml,conference}/sites"
      out << "# See TODO.work/01-discovery.md for the full discovery table."
      out << "#"
      out << "# Field reference:"
      out << "#   kind       : ciml | conference"
      out << "#   meeting    : CIML meeting number (kind=ciml)"
      out << "#   session    : Conference session number (kind=conference)"
      out << "#   year       : year of the meeting"
      out << "#   date_start : ISO 8601 meeting start date (from OCR cover page)"
      out << "#   date_end   : ISO 8601 meeting end date (from OCR cover page)"
      out << "#   venue      : host venue (string)"
      out << "#   doc_kind   : decisions | resolutions | decisions-joint-ciml-dc"
      out << "#   lang       : en | fr | bilingual"
      out << "#   title      : human-readable title (English gloss; FR titles kept in source PDFs)"
      out << "#   url        : canonical OIML URL"
      out << "#   slug       : normalized local filename (without .pdf extension)"
      out << ""
      out << "sources:"
      data["sources"].each do |s|
        out << "  - { " + %w[
          kind meeting session year date_start date_end venue doc_kind lang title url slug
        ].map { |k| s.key?(k) ? "#{k}: #{format_value(s[k])}" : nil }.compact.join(", ") + " }"
      end
      out.join("\n") + "\n"
    end

    def self.format_value(v)
      case v
      when Integer
        v.to_s
      when String
        if v.match?(/\A\d{4}-\d{2}-\d{2}\z/)
          "'#{v}'"  # ISO date - quote to prevent psych Date auto-parsing
        elsif v.match?(/\A[A-Za-z][A-Za-z0-9_-]*\z/)
          v
        else
          v.inspect
        end
      else
        v.inspect
      end
    end
  end
end

ResolutionsData::ExtractDates.run if $PROGRAM_NAME == __FILE__
