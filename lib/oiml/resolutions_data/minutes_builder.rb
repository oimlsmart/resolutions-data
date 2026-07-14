# frozen_string_literal: true

module Oiml
  module ResolutionsData
    # Build an `Edoxen::Minutes` instance (v1.0 per-field shape).
    #
    # In v1.0:
    #   - Minutes carries a single `spelling` (language+script) for the
    #     whole document; no `language_code` / `script` field.
    #   - MinutesSection.title and .narrative are LocalizedString[]
    #     (one entry per language variant). For single-language minutes
    #     we emit a single LocalizedString with the parent spelling.
    class MinutesBuilder
      attr_reader :identifier, :urn, :spelling, :sections, :source_doc

      def initialize(identifier:, urn:, spelling:, source_doc: nil)
        @identifier = identifier
        @urn = urn
        @spelling = spelling
        @source_doc = source_doc
        @sections = []
      end

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
          spelling: spelling,
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
          title: [Edoxen::LocalizedString.new(spelling: spelling, value: hash["title"])],
          narrative: [Edoxen::LocalizedString.new(spelling: spelling, value: hash["narrative"])],
        )
      end
    end
  end
end
