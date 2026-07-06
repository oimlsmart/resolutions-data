# frozen_string_literal: true

require "spec_helper"

module Oiml
  module ResolutionsData
    RSpec.describe IdentifierParser do
      describe ".parse" do
        it "parses a CIML identifier" do
          result = described_class.parse("CIML/2009/1")
          expect(result.prefix).to eq("CIML")
          expect(result.number).to eq("2009/1")
        end

        it "parses a Conference identifier" do
          result = described_class.parse("Conference/2004/9")
          expect(result.prefix).to eq("Conference")
          expect(result.number).to eq("2004/9")
        end

        it "parses a Development Council identifier" do
          result = described_class.parse("DC/2004/1")
          expect(result.prefix).to eq("DC")
          expect(result.number).to eq("2004/1")
        end

        it "parses an acclamation identifier" do
          result = described_class.parse("CIML/2009/1-acclaim-1")
          expect(result.prefix).to eq("CIML")
          expect(result.number).to eq("2009/1-acclaim-1")
          expect(result).to be_acclamation
        end

        it "parses a sub-item identifier" do
          result = described_class.parse("CIML/2025/14.2")
          expect(result.number).to eq("2025/14.2")
          expect(result.agenda_label).to eq("14.2")
        end

        it "returns nil for malformed input" do
          aggregate_failures do
            expect(described_class.parse(nil)).to be_nil
            expect(described_class.parse("")).to be_nil
            expect(described_class.parse("no-slash")).to be_nil
            expect(described_class.parse("/leading-slash")).to be_nil
            expect(described_class.parse("trailing-slash/")).to be_nil
          end
        end
      end

      describe "Result#acclamation?" do
        it "is true for an acclamation identifier" do
          expect(described_class.parse("CIML/2009/1-acclaim-1")).to be_acclamation
        end

        it "is false for a regular identifier" do
          expect(described_class.parse("CIML/2009/1")).not_to be_acclamation
        end
      end

      describe "Result#agenda_label" do
        it "extracts the trailing segment of the number" do
          expect(described_class.parse("Conference/2004/9").agenda_label).to eq("9")
        end

        it "preserves sub-item dots" do
          expect(described_class.parse("CIML/2025/14.2").agenda_label).to eq("14.2")
        end

        it "returns nil for acclamations" do
          expect(described_class.parse("CIML/2009/1-acclaim-1").agenda_label).to be_nil
        end
      end

      describe ".agenda_label (convenience)" do
        it "returns the agenda label for a valid identifier string" do
          expect(described_class.agenda_label("Conference/2004/9")).to eq("9")
        end

        it "returns nil for an acclamation" do
          expect(described_class.agenda_label("CIML/2009/1-acclaim-1")).to be_nil
        end

        it "returns nil for malformed input" do
          expect(described_class.agenda_label("garbage")).to be_nil
        end
      end

      describe "Result value-object semantics" do
        it "equals another result with the same prefix + number" do
          a = described_class.parse("CIML/2009/1")
          b = described_class.parse("CIML/2009/1")
          expect(a).to eq(b)
          expect(a.hash).to eq(b.hash)
        end

        it "renders as <prefix>/<number>" do
          expect(described_class.parse("DC/2004/1").to_s).to eq("DC/2004/1")
        end
      end
    end
  end
end
