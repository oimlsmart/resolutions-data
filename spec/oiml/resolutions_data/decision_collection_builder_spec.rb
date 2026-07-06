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
          "title_localized" => [
            { "language_code" => "eng", "title" => "Test Title (EN)" },
            { "language_code" => "fra", "title" => "Titre de test (FR)" },
          ],
        }
      end

      describe "#add_decision and #build" do
        it "builds an Edoxen::DecisionCollection with metadata + decisions" do
          builder = described_class.new(metadata: metadata)
          builder.add_decision(
            identifier: [{ "prefix" => "DC", "number" => "2004/1" }],
            doi: "10.63493/resolutions/dc20041",
            urn: "urn:oiml:dc:resolution:2004/1",
            agenda_item: "1",
            dates: [{ "date" => "2004-10-25", "type" => "decided" }],
            localizations: [
              {
                "language_code" => "eng",
                "title" => "Test decision",
                "subject" => "Test subject",
                "considerations" => [],
                "actions" => [],
                "approvals" => [],
              },
            ],
          )

          collection = builder.build
          expect(collection).to be_a(Edoxen::DecisionCollection)
          expect(collection.metadata.source).to eq("Test source")
          expect(collection.metadata.meeting_urn).to eq("urn:oiml:dc:meeting:dc-1-2004")
          expect(collection.metadata.title_localized.size).to eq(2)

          decision = collection.decisions.first
          expect(decision.identifier.first.prefix).to eq("DC")
          expect(decision.identifier.first.number).to eq("2004/1")
          expect(decision.doi).to eq("10.63493/resolutions/dc20041")
          expect(decision.agenda_item).to eq("1")
          expect(decision.dates.first.date.to_s).to eq("2004-10-25")
          expect(decision.localizations.first.title).to eq("Test decision")
        end

        it "emits YAML that round-trips through Edoxen" do
          builder = described_class.new(metadata: metadata)
          builder.add_decision(
            identifier: [{ "prefix" => "DC", "number" => "2004/1" }],
            doi: "10.63493/resolutions/dc20041",
            urn: "urn:oiml:dc:resolution:2004/1",
            dates: [{ "date" => "2004-10-25", "type" => "decided" }],
            localizations: [{
              "language_code" => "eng",
              "title" => "Test",
              "considerations" => [],
              "actions" => [],
              "approvals" => [],
            }],
          )

          yaml = builder.to_yaml
          parsed = YAML.safe_load(yaml)
          expect(parsed["decisions"].first["identifier"].first["prefix"]).to eq("DC")
          expect(parsed["metadata"]["source"]).to eq("Test source")
        end

        it "builds actions with date_effective" do
          builder = described_class.new(metadata: metadata)
          builder.add_decision(
            identifier: [{ "prefix" => "DC", "number" => "2004/1" }],
            doi: "x", urn: "x",
            dates: [],
            localizations: [{
              "language_code" => "eng",
              "title" => "x",
              "considerations" => [],
              "actions" => [{
                "type" => "resolution",
                "message" => "The DC acted.",
                "date_effective" => { "date" => "2004-10-25", "type" => "decided" },
              }],
              "approvals" => [],
            }],
          )

          action = builder.build.decisions.first.localizations.first.actions.first
          expect(action.message).to eq("The DC acted.")
          expect(action.date_effective.date.to_s).to eq("2004-10-25")
        end
      end
    end
  end
end
