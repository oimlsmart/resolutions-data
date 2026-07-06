# frozen_string_literal: true

module Oiml
  module ResolutionsData
    module Ocr
      # Lazily read OCR markdown files from `reference-docs/ocr/md/`.
      # Each file is named `<source_pdf_slug>.md` and contains the
      # concatenated GLM-OCR markdown for that PDF.
      #
      # The reader never holds all files in memory — it yields one at a
      # time, which keeps peak memory low for the ~120 md files (~5 MB
      # total).
      class MarkdownReader
        MD_DIR = File.expand_path("../../../../reference-docs/ocr/md", __dir__).freeze

        attr_reader :path, :slug

        def initialize(path:)
          @path = path
          @slug = File.basename(path, ".md")
        end

        # Read the full markdown content. Returns "" if the file is
        # missing.
        def content
          return "" unless File.file?(path)
          File.read(path)
        end

        # Iterate every md file under MD_DIR. Yields MarkdownReader
        # instances. Files are sorted by slug for deterministic order.
        def self.each(&block)
          return enum_for(:each) unless block_given?

          Dir.glob(File.join(MD_DIR, "*.md")).sort.each do |path|
            yield new(path: path)
          end
        end

        # Look up a single md file by source slug. Returns a
        # MarkdownReader or nil.
        def self.for_slug(slug)
          return nil if slug.nil? || slug.to_s.empty?

          path = File.join(MD_DIR, "#{slug}.md")
          return nil unless File.file?(path)

          new(path: path)
        end
      end
    end
  end
end
