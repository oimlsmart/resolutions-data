#!/usr/bin/env ruby
# frozen_string_literal: true

# Cross-check GLM-OCR markdown against the PDF's own text layer (pdftotext).
# PDFs are computer-generated (per user direction), so the text layer is
# ground truth. Reports per-PDF and overall:
#   - Jaccard word similarity (lower-cased, alphanumeric tokens)
#   - Word counts (pdftotext / GLM-OCR)
#   - Top missing/extra words
# Non-zero exit if any PDF falls below --min-similarity (default 0.85).

require "open3"
require "fileutils"
require "set"
require "optparse"

module ResolutionsData
  module Verify
    ROOT   = File.expand_path("../", __dir__)
    PDFS   = Dir.glob(File.join(ROOT, "reference-docs", "{ciml,conferences}", "**", "*.pdf")).sort
    MD_DIR = File.join(ROOT, "reference-docs", "ocr", "md")
    TXT_DIR = File.join(ROOT, "reference-docs", "ocr", "text")

    DEFAULT_MIN_SIMILARITY = 0.85
    STOPWORDS = Set.new(%w[the of and to a in for is on that with by as at an be from or this it are was were will has had].concat(%w[le la les des du de et à en un une pour que qui dans sur par ne pas ce cette]))

    def self.run(min_similarity: DEFAULT_MIN_SIMILARITY)
      FileUtils.mkdir_p(TXT_DIR)
      rows = []
      total = { pdf_words: 0, md_words: 0, intersect: 0, union: 0 }

      PDFS.each do |pdf|
        slug = File.basename(pdf, ".pdf")
        md_path = File.join(MD_DIR, "#{slug}.md")
        txt_path = File.join(TXT_DIR, "#{slug}.txt")

        unless File.exist?(md_path)
          warn "  MISSING md for #{slug}"
          next
        end

        write_text_layer(pdf, txt_path)
        pdf_text = File.read(txt_path)
        md_text  = File.read(md_path)

        pdf_words = tokenize(pdf_text)
        md_words  = tokenize(md_text)
        pdf_set   = Set.new(pdf_words)
        md_set    = Set.new(md_words)

        inter = pdf_set & md_set
        uni   = pdf_set | md_set
        jacc  = uni.empty? ? 1.0 : inter.size.to_f / uni.size

        # containment in each direction — more forgiving than Jaccard for
        # cases where GLM-OCR adds header/footer/boilerplate
        pdf_in_md = pdf_set.empty? ? 1.0 : (inter.size.to_f / pdf_set.size)
        md_in_pdf = md_set.empty? ? 1.0 : (inter.size.to_f / md_set.size)

        total[:pdf_words] += pdf_set.size
        total[:md_words]  += md_set.size
        total[:intersect] += inter.size
        total[:union]     += uni.size

        missing = (pdf_set - md_set).reject { |w| STOPWORDS.include?(w) }.sort_by { |w| -pdf_words.count(w) }.first(8)
        extra   = (md_set - pdf_set).reject { |w| STOPWORDS.include?(w) }.sort_by { |w| -md_words.count(w) }.first(8)

        rows << { slug: slug, pages: page_count(pdf), jacc: jacc,
                  pim: pdf_in_md, mip: md_in_pdf,
                  pdf_unique: pdf_set.size, md_unique: md_set.size,
                  missing: missing, extra: extra }
      end

      print_report(rows, total, min_similarity)
      below = rows.count { |r| r[:pim] < min_similarity }
      exit 1 if below > 0
    end

    def self.write_text_layer(pdf, dest)
      out, _, st = Open3.capture3("pdftotext", "-layout", pdf, dest)
      raise "pdftotext failed on #{pdf}: #{st}" unless st.success?
      raise "pdftotext produced empty output for #{pdf}" if File.size(dest).zero?
    end

    def self.tokenize(text)
      text.downcase.scan(/[[:alnum:]][[:alnum:]\-']*/).reject(&:empty?)
    end

    def self.page_count(pdf)
      out, _, _ = Open3.capture3("pdfinfo", pdf)
      out =~ /^Pages:\s+(\d+)/ ? $1.to_i : 0
    end

    def self.print_report(rows, total, min_similarity)
      puts "Per-PDF verification (sorted by pdf_in_md ascending):"
      puts
      printf "  %-45s %4s  %6s  %6s  %6s\n", "slug", "pages", "jacc", "p_in_m", "m_in_p"
      puts  "  " + "-" * 80
      rows.sort_by { |r| r[:pim] }.each do |r|
        flag = r[:pim] < min_similarity ? " ✗" : "  "
        printf "%s %-45s %4d  %5.3f  %5.3f  %5.3f\n", flag, r[:slug], r[:pages], r[:jacc], r[:pim], r[:mip]
      end
      puts
      puts "Overall (unique-word sets):"
      printf "  pdf unique words total:   %d\n", total[:pdf_words]
      printf "  md  unique words total:   %d\n", total[:md_words]
      printf "  intersection:             %d\n", total[:intersect]
      printf "  union:                    %d\n", total[:union]
      printf "  overall Jaccard:          %.4f\n", total[:union].zero? ? 1.0 : total[:intersect].to_f / total[:union]
      puts
      below = rows.select { |r| r[:pim] < min_similarity }
      if below.empty?
        puts "All 51 PDFs above min pdf_in_md = #{min_similarity}."
      else
        puts "PDFs below min pdf_in_md = #{min_similarity}:"
        below.each do |r|
          puts "  #{r[:slug]} (p_in_m=#{r[:pim].round(3)})"
          puts "    top missing (in PDF, not in OCR): #{r[:missing].join(', ')}" if r[:missing].any?
          puts "    top extra   (in OCR, not in PDF): #{r[:extra].join(', ')}"   if r[:extra].any?
        end
      end
    end
  end
end

if $PROGRAM_NAME == __FILE__
  options = { min_similarity: ResolutionsData::Verify::DEFAULT_MIN_SIMILARITY }
  OptionParser.new do |opts|
    opts.banner = "Usage: verify_ocr.rb [--min-similarity N]"
    opts.on("--min-similarity F", Float) { |v| options[:min_similarity] = v }
  end.parse!
  ResolutionsData::Verify.run(min_similarity: options[:min_similarity])
end
