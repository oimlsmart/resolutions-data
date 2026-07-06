# frozen_string_literal: true

require "spec_helper"

module Oiml
  module ResolutionsData
    module Pdf
      RSpec.describe TextExtractor do
        let(:repo_root) { File.expand_path("../../../..", __dir__) }
        let(:agenda_pdf) { File.join(repo_root, "reference-docs", "agendas", "ciml-60-agenda-en.pdf") }

        describe ".extract" do
          # pdftotext is a system dep (poppler); skip when not installed
          # (e.g. CI without the poppler apt package).
          before { skip "pdftotext not installed" unless system("which pdftotext > /dev/null 2>&1") }

          it "extracts layout-preserved text from a real agenda PDF" do
            text = described_class.extract(agenda_pdf)
            expect(text).to be_a(String)
            expect(text).to include("60th Meeting")
            expect(text).to include("Opening remarks")
          end
        end

        describe "#extract" do
          it "returns empty string for a missing file" do
            extractor = described_class.new(pdf_path: "/nonexistent/file.pdf")
            expect(extractor.extract).to eq("")
          end

          it "returns empty string for nil path" do
            extractor = described_class.new(pdf_path: nil)
            expect(extractor.extract).to eq("")
          end

          it "raises ExtractionError when pdftotext is not installed" do
            extractor = described_class.new(pdf_path: agenda_pdf)
            allow(Open3).to receive(:capture3).and_raise(Errno::ENOENT)
            expect { extractor.extract }.to raise_error(described_class::ExtractionError, /pdftotext/)
          end
        end
      end
    end
  end
end
