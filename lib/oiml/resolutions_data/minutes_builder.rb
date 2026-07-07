# frozen_string_literal: true

module Oiml
  module ResolutionsData
    # Build an `Edoxen::Minutes` instance from extracted sections.
    #
    # Wraps the Edoxen::Minutes model so callers don't couple to it
    # directly. Mirrors the AgendaBuilder / DecisionCollectionBuilder
    # pattern.
    class MinutesBuilder
      attr_reader :identifier, :urn, :language_code, :sections, :source_doc

      # identifier   — Array<Edoxen::StructuredIdentifier>
      # urn          — full URN string
      # language_code — "eng" / "fra" / ...
      def initialize(identifier:, urn:, language_code:, source_doc: nil)
        @identifier = identifier
        @urn = urn
        @language_code = language_code
        @source_doc = source_doc
        @sections = []
      end

      # Append a minutes section.
      #   number   — agenda-item label ("1", "14.2", "IV e")
      #   title    — section heading text
      #   narrative — markdown body
      def add_section(number:, title:, narrative:)
        sections << {
          "number" => number.to_s,
          "title" => title,
          "narrative" => narrative,
        }
        self
      end

      def build
        require "edoxen"
        Edoxen::Minutes.new(
          identifier: identifier,
          urn: urn,
          language_code: language_code,
          script: "Latn",
          source_doc: source_doc,
          sections: sections.map { |h| build_section(h) },
        )
      end

      def to_yaml
        build.to_yaml
      end

      private

      def build_section(hash)
        require "edoxen"
        Edoxen::MinutesSection.new(
          number: hash["number"],
          title: hash["title"],
          narrative: hash["narrative"],
        )
      end
    end
  end
end
