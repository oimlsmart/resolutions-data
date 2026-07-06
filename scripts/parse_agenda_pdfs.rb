#!/usr/bin/env ruby
# frozen_string_literal: true

# Parse agenda PDFs in reference-docs/agendas/ and emit agendas/<slug>.yaml
# with real item titles extracted from the PDFs.
#
# Uses pdftotext -layout so that "label  title" stays on a single line,
# making the structure easy to recognise:
#
#   1    Opening remarks and roll call
#   2    Adoption of the agenda
#   6    Financial matters
#        6.1   2024 accounts
#        6.2   Arrears of Member States
#
# PDF → slug mapping: ciml-NN-agenda-{en,fr}.pdf and conference-NN-agenda-{en,fr}.pdf.

require "open3"
require "yaml"
require "fileutils"

ROOT = File.expand_path("..", __dir__)
AGENDA_PDF_DIR = File.join(ROOT, "reference-docs", "agendas")
OUT_DIR = File.join(ROOT, "agendas")
FileUtils.mkdir_p(OUT_DIR)

def pdf_text(path)
  out, = Open3.capture2("pdftotext", "-layout", path, "-")
  out
rescue StandardError
  ""
end

def classify_kind(title, label)
  t = title.downcase
  return "opening" if t =~ /\b(opening|welcome|allocution|adresse|roll.call|quorum)\b/i
  return "closing" if t =~ /\b(closing|cl[oô]ture|farewell|date and place of the next)\b/i
  return "aob" if t =~ /\b(any other business|aob|questions diverses|divers)\b/i
  # Sub-items inherit "numbered" kind. Top-level items with no sub-items
  # are also "numbered". (We don't model "header" here because the PDFs
  # don't distinguish section headers from items.)
  "numbered"
end

def infer_outcome(title)
  t = title.downcase
  return "adopted" if t =~ /\b(approval of|adoption of|approves|adopte)\b/i
  "discussed"
end

# Header / noise lines we never want to treat as titles.
HEADER_RE = /(?:version\s+v?\d|draft\s+agenda|annotated\s+agenda|provis\w+\s+agenda|ciml\s+meeting|international\s+conference|international\s+committee|international\s+organization|organisation\s+internationale|legal\s+metrology|page\s+\d+\s+of\s+\d+)/i.freeze

# Lines that look like a date (e.g., "13 and 15 October 2025",
# "20-22 October 2015", "26 & 29 October 2004"). Treat as header noise.
DATE_RE = /\A\d{1,2}(?:\s*(?:&|and|-|to)\s*\d{1,2})?\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\b/i.freeze

# Parse a -layout pdftotext dump and return items.
def parse_agenda_text(text)
  lines = text.split(/\r?\n/).map { |l| l.rstrip }
  items = []

  # Optional preamble lines (no label): "Opening addresses", "Roll-call",
  # "Approval of the agenda". They appear before the first numbered item.
  preamble = []
  in_preamble = true

  lines.each do |raw|
    line = raw.strip
    next if line.empty?

    # Session header (e.g., "Session 1: 13 October (morning)") — skip
    # the line but use it as a section break.
    next if line =~ /\Asession\s+\d+/i

    # Numbered item: optional indent, then "N(.N)*  title"
    if line =~ /\A\s*(\d+(?:\.\d+)*)\s{2,}(.+)\z/
      label = Regexp.last_match(1)
      title = Regexp.last_match(2).strip
      # Reject obvious header lines that happened to match the pattern.
      next if title.empty?
      next if title.length > 200
      in_preamble = false
      items << {
        "label" => label,
        "kind" => classify_kind(title, label),
        "title" => title,
        "outcome" => infer_outcome(title),
      }
      next
    end

    # Same-line compact form: "1. Title"
    if line =~ /\A(\d+(?:\.\d+)*)\.\s+(.+)\z/
      label = Regexp.last_match(1)
      title = Regexp.last_match(2).strip
      in_preamble = false
      items << {
        "label" => label,
        "kind" => classify_kind(title, label),
        "title" => title,
        "outcome" => infer_outcome(title),
      }
      next
    end

    # Preamble line (before any numbered item).
    if in_preamble
      # Skip header noise.
      next if line =~ HEADER_RE
      next if line =~ DATE_RE
      # Skip very short or numeric-only lines.
      next if line.length < 4
      next if line =~ /\A[\d\s\.,–_-]+\z/
      preamble << line
    end
  end

  # Convert the preamble block (lines like "Opening addresses", "Roll-call",
  # "Approval of the agenda") into synthetic items with labels "a", "b",
  # "c". They sit ahead of numbered item "1" so the ordering is preserved.
  preamble_items = []
  preamble.each_with_index do |title, idx|
    preamble_items << {
      "label" => (97 + idx).chr,  # 'a', 'b', 'c', ...
      "kind" => classify_kind(title, nil),
      "title" => title,
      "outcome" => infer_outcome(title),
    }
  end

  preamble_items + items
end

def sort_items(items)
  # Sort by hierarchical label components. Preamble items ('a','b',...)
  # come first because their label sorts before any digit.
  items.sort_by { |it|
    label = it["label"].to_s
    if label =~ /\A\d/
      [1, label.split(".").map { |n| n.to_i }]
    else
      [0, label]
    end
  }
end

def slug_from_pdf(name)
  if name =~ /(ciml-\d+|conference-\d+)-agenda-(en|fr)\.pdf/i
    return Regexp.last_match(1)
  end
  nil
end

pdfs_by_slug = {}
Dir.glob(File.join(AGENDA_PDF_DIR, "*.pdf")).sort.each do |path|
  slug = slug_from_pdf(File.basename(path)) or next
  pdfs_by_slug[slug] ||= { "en" => nil, "fr" => nil }
  lang = File.basename(path) =~ /-fr\.pdf$/i ? "fr" : "en"
  pdfs_by_slug[slug][lang] = path
end

written = 0
pdfs_by_slug.each do |slug, pdfs|
  items_en = pdfs["en"] ? parse_agenda_text(pdf_text(pdfs["en"])) : []
  items_fr = pdfs["fr"] ? parse_agenda_text(pdf_text(pdfs["fr"])) : []

  items = items_en.any? ? items_en : items_fr
  next if items.empty?

  items = sort_items(items)
  kind = slug.start_with?("conference") ? "conference" : "ciml"
  ordinal = slug[/(\d+)$/].to_i
  meeting_urn = "urn:oiml:#{kind}:meeting:#{slug}"
  items.each do |it|
    it["urn"] = "#{meeting_urn}:agenda:" + it["label"].to_s
  end

  prefix = kind == "ciml" ? "CIML" : "OIML Conference"
  data = {
    "identifier" => [{ "prefix" => prefix, "number" => ordinal.to_s }],
    "urn" => meeting_urn,
    "status" => "final",
    "items" => items,
  }

  out_path = File.join(OUT_DIR, "#{slug}.yaml")
  File.write(out_path, "---\n# Auto-generated by scripts/parse_agenda_pdfs.rb from reference-docs/agendas/*.pdf.\n" +
                       data.to_yaml.sub(/^---\s*$/, "").lstrip)
  written += 1
  puts "  #{slug}: #{items.size} items ← #{[pdfs['en'], pdfs['fr']].compact.map { |p| File.basename(p) }.join(', ')}"
end

puts "\n#{written} agenda YAML(s) written to #{OUT_DIR}."
