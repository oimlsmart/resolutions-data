# frozen_string_literal: true

require "spec_helper"

module Oiml
  module ResolutionsData
    module Ocr
      RSpec.describe MarkdownReader do
        let(:repo_root) { File.expand_path("../../../..", __dir__) }
        let(:md_dir) { File.join(repo_root, "reference-docs", "ocr", "md") }

        describe ".for_slug" do
          it "returns a reader for an existing md file" do
            reader = described_class.for_slug("ciml-60-agenda-en")
            expect(reader).not_to be_nil
            expect(reader.slug).to eq("ciml-60-agenda-en")
            expect(reader.content).to include("Draft Agenda")
          end

          it "returns nil for a missing slug" do
            expect(described_class.for_slug("does-not-exist")).to be_nil
          end

          it "returns nil for nil input" do
            expect(described_class.for_slug(nil)).to be_nil
          end
        end

        describe ".each" do
          it "yields one reader per md file in the directory" do
            count = described_class.each.count
            expected = Dir.glob(File.join(md_dir, "*.md")).size
            expect(count).to eq(expected)
          end

          it "yields MarkdownReader instances" do
            first = described_class.each.first
            expect(first).to be_a(described_class)
          end
        end

        describe "#content" do
          it "returns the file contents for an existing slug" do
            content = described_class.for_slug("ciml-60-agenda-en").content
            expect(content).to be_a(String)
            expect(content.size).to be > 100
          end
        end
      end
    end
  end
end
