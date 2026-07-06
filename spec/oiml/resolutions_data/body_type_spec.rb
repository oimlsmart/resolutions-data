# frozen_string_literal: true

require "spec_helper"

module Oiml
  module ResolutionsData
    RSpec.describe BodyType do
      describe ".from_slug" do
        it "maps ciml- prefix to :ciml" do
          expect(described_class.from_slug("ciml-44")).to eq(:ciml)
        end

        it "maps conference- prefix to :conference" do
          expect(described_class.from_slug("conference-12")).to eq(:conference)
        end

        it "maps dc- prefix to :dc" do
          expect(described_class.from_slug("dc-1-2004")).to eq(:dc)
        end

        it "returns nil for an unknown prefix" do
          expect(described_class.from_slug("garbage-1")).to be_nil
        end

        it "returns nil for nil input" do
          expect(described_class.from_slug(nil)).to be_nil
        end

        it "returns nil for empty input" do
          expect(described_class.from_slug("")).to be_nil
        end
      end

      describe ".all" do
        it "lists the three OIML body types in stable order" do
          expect(described_class.all).to eq(%i[ciml conference dc])
        end
      end

      describe ".label" do
        it "returns the display label for each body" do
          aggregate_failures do
            expect(described_class.label(:ciml)).to eq("CIML Meeting")
            expect(described_class.label(:conference)).to eq("OIML Conference")
            expect(described_class.label(:dc)).to eq("OIML Development Council")
          end
        end
      end

      describe ".badge" do
        it "returns the short badge for each body" do
          aggregate_failures do
            expect(described_class.badge(:ciml)).to eq("CIML")
            expect(described_class.badge(:conference)).to eq("CONF")
            expect(described_class.badge(:dc)).to eq("DC")
          end
        end
      end

      describe ".slug_prefix" do
        it "returns the URN slug prefix for each body" do
          aggregate_failures do
            expect(described_class.slug_prefix(:ciml)).to eq("ciml")
            expect(described_class.slug_prefix(:conference)).to eq("conference")
            expect(described_class.slug_prefix(:dc)).to eq("dc")
          end
        end
      end
    end
  end
end
