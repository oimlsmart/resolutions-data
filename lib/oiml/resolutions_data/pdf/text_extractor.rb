# frozen_string_literal: true

require "open3"

module Oiml
  module ResolutionsData
    module Pdf
      # Wrapper around `pdftotext -layout` for extracting structured
      # text from OIML PDFs (agendas, decisions, minutes).
      #
      # Why -layout: it preserves the "N  Title" row alignment that
      # the agenda PDFs use, which makes table-style parsing easy.
      # Without -layout, pdftotext returns numbers and titles on
      # separate lines, requiring more complex regex.
      class TextExtractor
        class ExtractionError < StandardError; end

        attr_reader :pdf_path

        def initialize(pdf_path:)
          @pdf_path = pdf_path
        end

        # Extract text from the PDF. Returns "" for missing files.
        # Raises ExtractionError if pdftotext exists but fails.
        def extract
          return "" unless pdf_path && File.file?(pdf_path)

          out, err, status = Open3.capture3("pdftotext", "-layout", pdf_path, "-")
          raise ExtractionError, err unless status.success?

          out
        rescue Errno::ENOENT
          raise ExtractionError, "pdftotext binary not found on PATH"
        end

        # Convenience: extract text from a path string in one call.
        def self.extract(pdf_path)
          new(pdf_path: pdf_path).extract
        end
      end
    end
  end
end
