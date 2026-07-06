#!/usr/bin/env ruby
# frozen_string_literal: true

# Build reference-docs/ocr/raw/_index.yaml mapping every cached OCR
# response to its source PDF and chunk range.
#
# The cache is keyed by SHA-256("<pdf_path>|<start_page>|<end_page>")[0,16]
# (see scripts/ocr/glm_ocr.rb). For every PDF under reference-docs/{ciml,
# conferences, agendas} we recompute the key for every 100-page chunk
# and record the (hash → source) mapping.
#
# Re-runnable; the index is the source of truth for which PDF each raw
# JSON came from.

require "digest"
require "yaml"
require "open3"
require "fileutils"

ROOT = File.expand_path("../..", __dir__)
OCR_RAW_DIR = File.join(ROOT, "reference-docs", "ocr", "raw")
INDEX_PATH = File.join(OCR_RAW_DIR, "_index.yaml")

PAGES_PER_CHUNK = 100

def cache_key_for(input, start_page, end_page)
  Digest::SHA256.hexdigest("#{input}|#{start_page}|#{end_page}")[0, 16]
end

def page_count(pdf)
  out, _, st = Open3.capture3("pdfinfo", pdf)
  return Regexp.last_match(1).to_i if out =~ /^Pages:\s+(\d+)/
  out, = Open3.capture3("mdls", "-name", "kMDItemNumberOfPages", pdf)
  return Regexp.last_match(1).to_i if out =~ /=\s+(\d+)/
  warn "  cannot determine page count for #{pdf}"
  1
end

# Discover every source PDF.
pdfs = []
Dir.glob(File.join(ROOT, "reference-docs", "{ciml,conferences,agendas}", "**", "*.pdf")).sort.each do |p|
  pdfs << p
end

# Build index.
index = {}
missing = []
pdfs.each do |pdf|
  rel = pdf.sub("#{ROOT}/", "")
  slug = File.basename(pdf, ".pdf")
  pages = page_count(pdf)
  (1..pages).step(PAGES_PER_CHUNK).each do |start_page|
    end_page = [start_page + PAGES_PER_CHUNK - 1, pages].min
    key = cache_key_for(pdf, start_page, end_page)
    json_path = File.join(OCR_RAW_DIR, "#{key}.json")
    exists = File.exist?(json_path)
    size = exists ? File.size(json_path) : 0
    index[key] = {
      "pdf" => rel,
      "slug" => slug,
      "start_page" => start_page,
      "end_page" => end_page,
      "cached" => exists,
      "bytes" => size,
    }
    missing << key unless exists
  end
end

# Also detect orphan JSONs (cached but not tied to any current PDF).
all_cached = Dir.glob(File.join(OCR_RAW_DIR, "*.json")).map { |p| File.basename(p, ".json") }
orphans = all_cached - index.keys - ["_index"]

# Write the index. Sort by source PDF for readability.
File.write(INDEX_PATH, {
  "generated_at" => Time.now.utc.iso8601,
  "cache_dir" => "reference-docs/ocr/raw",
  "total_pdfs" => pdfs.size,
  "total_chunks" => index.size,
  "cached_chunks" => index.count { |_, v| v["cached"] },
  "missing_chunks" => missing.size,
  "orphan_json_files" => orphans.size,
  "chunks" => index.sort_by { |_, v| [v["pdf"], v["start_page"]] }.to_h,
  "orphans" => orphans.sort,
}.to_yaml)

puts "Index written to #{INDEX_PATH}"
puts "  PDFs scanned      : #{pdfs.size}"
puts "  Chunks expected   : #{index.size}"
puts "  Chunks cached     : #{index.count { |_, v| v['cached'] }}"
puts "  Chunks missing    : #{missing.size}"
puts "  Orphan JSON files : #{orphans.size}"
if missing.any?
  puts
  puts "Missing chunks (need OCR):"
  missing.first(20).each do |k|
    info = index[k]
    puts "  #{k}  ← #{info['slug']} pages #{info['start_page']}-#{info['end_page']}"
  end
  puts "  ... and #{missing.size - 20} more" if missing.size > 20
end
if orphans.any?
  puts
  puts "Orphan JSON files (no PDF matches their cache key):"
  orphans.first(10).each { |k| puts "  #{k}.json" }
  puts "  ... and #{orphans.size - 10} more" if orphans.size > 10
end
