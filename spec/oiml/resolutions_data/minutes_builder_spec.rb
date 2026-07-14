# frozen_string_literal: true

require "spec_helper"
require "edoxen"

module Oiml
  module ResolutionsData
    RSpec.describe MinutesBuilder do
      let(:identifier) { [Edoxen::StructuredIdentifier.new(prefix: "CIML", number: "60")] }
      let(:urn) { "urn:oiml:ciml:minutes:ciml-60-eng" }

      describe "#add_section and #build" do
        it "builds an Edoxen::Minutes with all sections (v1.0 per-field shape)" do
          builder = described_class.new(identifier: identifier, urn: urn, spelling: "eng")
          builder.add_section(number: "1", title: "Opening remarks", narrative: "Body text.")
          builder.add_section(number: "14.2", title: "Financial matters", narrative: "More body.")

          minutes = builder.build
          expect(minutes).to be_a(Edoxen::Minutes)
          expect(minutes.urn).to eq(urn)
          expect(minutes.spelling).to eq("eng")
          expect(minutes.sections.size).to eq(2)
          expect(minutes.sections.first.number).to eq("1")
          expect(minutes.sections.first.title.first.value).to eq("Opening remarks")
          expect(minutes.sections.last.number).to eq("14.2")
        end

        it "carries source_doc when provided" do
          builder = described_class.new(
            identifier: identifier,
            urn: urn,
            spelling: "eng",
            source_doc: "https://example.com/source.pdf",
          )
          expect(builder.build.source_doc).to eq("https://example.com/source.pdf")
        end

        it "supports find_section via the underlying model" do
          builder = described_class.new(identifier: identifier, urn: urn, spelling: "eng")
          builder.add_section(number: "14.2", title: "Financial matters", narrative: "x")
          minutes = builder.build
          expect(minutes.find_section("14.2")&.title&.first&.value).to eq("Financial matters")
          expect(minutes.find_section("99")).to be_nil
        end
      end

      describe "#to_yaml" do
        it "round-trips through YAML.safe_load" do
          builder = described_class.new(identifier: identifier, urn: urn, spelling: "eng")
          builder.add_section(number: "1", title: "First", narrative: "Body")
          parsed = YAML.safe_load(builder.to_yaml)

          expect(parsed["urn"]).to eq(urn)
          expect(parsed["spelling"]).to eq("eng")
          expect(parsed["sections"].first["number"]).to eq("1")
          # v1.0: title is LocalizedString[]
          title_ls = parsed["sections"].first["title"].first
          expect(title_ls).to include("spelling" => "eng", "value" => "First")
        end
      end
    end
  end
end
