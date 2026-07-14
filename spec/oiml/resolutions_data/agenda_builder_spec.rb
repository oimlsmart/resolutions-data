# frozen_string_literal: true

require "spec_helper"
require "edoxen"

module Oiml
  module ResolutionsData
    RSpec.describe AgendaBuilder do
      let(:meeting_urn) { "urn:oiml:ciml:meeting:ciml-60" }
      let(:identifier) { [Edoxen::StructuredIdentifier.new(prefix: "CIML", number: "60")] }

      describe "#add_item and #build" do
        it "builds an Edoxen::Agenda with all items" do
          builder = described_class.new(meeting_urn: meeting_urn, identifier: identifier)
          builder.add_item(label: "1", title: "Opening remarks and roll call")
          builder.add_item(label: "2", title: "Adoption of the agenda", outcome: "adopted")

          agenda = builder.build
          expect(agenda).to be_a(Edoxen::Agenda)
          expect(agenda.items.size).to eq(2)
          expect(agenda.items.first.label).to eq("1")
          expect(agenda.items.first.title.first.value).to eq("Opening remarks and roll call")
          expect(agenda.items.first.kind).to eq("opening")
          expect(agenda.items.last.outcome).to eq("adopted")
        end

        it "marks status as 'final' when items exist" do
          builder = described_class.new(meeting_urn: meeting_urn, identifier: identifier)
          builder.add_item(label: "1", title: "anything")
          expect(builder.build.status).to eq("final")
        end

        it "marks status as 'draft' when no items" do
          builder = described_class.new(meeting_urn: meeting_urn, identifier: identifier)
          expect(builder.build.status).to eq("draft")
        end

        it "classifies Opening/Closing/AOB by title text" do
          builder = described_class.new(meeting_urn: meeting_urn, identifier: identifier)
          builder.add_item(label: "a", title: "Opening addresses")
          builder.add_item(label: "b", title: "Roll-call - Quorum")
          builder.add_item(label: "c", title: "Any other business")
          builder.add_item(label: "d", title: "Closing remarks")
          builder.add_item(label: "1", title: "Approval of the minutes")

          kinds = builder.items.map { |i| i["kind"] }
          expect(kinds).to eq(%w[opening opening aob closing numbered])
        end
      end

      describe "#to_yaml" do
        it "emits valid YAML with the expected shape" do
          builder = described_class.new(meeting_urn: meeting_urn, identifier: identifier)
          builder.add_item(label: "1", title: "First item", outcome: "resolved")
          yaml = builder.to_yaml

          parsed = YAML.safe_load(yaml)
          item = parsed["items"].first
          expect(item["label"]).to eq("1")
          # v1.0: title is LocalizedString[]
          expect(item["title"].first).to include("spelling" => "eng", "value" => "First item")
          expect(item["outcome"]).to eq("resolved")
        end
      end
    end
  end
end
