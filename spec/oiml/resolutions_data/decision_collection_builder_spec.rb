# frozen_string_literal: true

require "spec_helper"
require "edoxen"

module Oiml
  module ResolutionsData
    RSpec.describe DecisionCollectionBuilder do
      let(:metadata) do
        {
          "source" => "Test source",
          "meeting_urn" => "urn:oiml:dc:meeting:dc-1-2004",
          "city" => "DEBER",
          "country_code" => "DE",
          "titles" => [
            { "spelling" => "eng", "value" => "Test Title (EN)" },
            { "spelling" => "fra", "value" => "Titre de test (FR)" },
          ],
        }
      end

      describe "#add_decision and #build" do
        it "builds an Edoxen::DecisionCollection with metadata + decisions in v1.0 shape" do
          builder = described_class.new(metadata: metadata)
          builder.add_decision(
            identifier: [{ "prefix" => "DC", "number" => "2004/1" }],
            doi: "10.63493/resolutions/dc20041",
            urn: "urn:oiml:dc:resolution:2004/1",
            agenda_item: "1",
            dates: [{ "date" => "2004-10-25", "type" => "decided" }],
            titles: [{ "spelling" => "eng", "value" => "Test decision" }],
            subjects: [{ "spelling" => "eng", "value" => "Test subject" }],
          )

          collection = builder.build
          expect(collection).to be_a(Edoxen::DecisionCollection)
          expect(collection.metadata.source).to eq("Test source")
          expect(collection.metadata.meeting_urn).to eq("urn:oiml:dc:meeting:dc-1-2004")
          expect(collection.metadata.title.size).to eq(2)
          expect(collection.metadata.title.first.value).to eq("Test Title (EN)")

          decision = collection.decisions.first
          expect(decision.identifier.first.prefix).to eq("DC")
          expect(decision.doi).to eq("10.63493/resolutions/dc20041")
          expect(decision.agenda_item).to eq("1")
          expect(decision.title.first.value).to eq("Test decision")
          expect(decision.subject.first.value).to eq("Test subject")
        end

        it "round-trips through to_yaml" do
          builder = described_class.new(metadata: metadata)
          builder.add_decision(
            identifier: [{ "prefix" => "DC", "number" => "2004/1" }],
            doi: "x", urn: "x",
            dates: [{ "date" => "2004-10-25", "type" => "decided" }],
            titles: [{ "spelling" => "eng", "value" => "Decision title" }],
          )

          yaml = builder.to_yaml
          parsed = YAML.safe_load(yaml)
          expect(parsed["decisions"].first["title"].first).to include(
            "spelling" => "eng",
            "value" => "Decision title",
          )
          expect(parsed["metadata"]["title"].first["value"]).to eq("Test Title (EN)")
        end

        it "builds actions/considerations with LocalizedString message arrays" do
          builder = described_class.new(metadata: metadata)
          builder.add_decision(
            identifier: [{ "prefix" => "DC", "number" => "2004/1" }],
            doi: "x", urn: "x",
            dates: [],
            titles: [{ "spelling" => "eng", "value" => "x" }],
            actions: [{
              "type" => "resolution",
              "message" => [{ "spelling" => "eng", "value" => "The DC acted." }],
              "date_effective" => { "date" => "2004-10-25", "type" => "decided" },
            }],
          )

          action = builder.build.decisions.first.actions.first
          expect(action.message.first.value).to eq("The DC acted.")
          expect(action.date_effective.date.to_s).to eq("2004-10-25")
        end
      end
    end
  end
end
