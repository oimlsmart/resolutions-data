# frozen_string_literal: true

module Oiml
  module ResolutionsData
    # Build an `Edoxen::DecisionCollection` instance from per-decision
    # hashes. Like AgendaBuilder, this isolates the Edoxen model API
    # from the parsing scripts.
    class DecisionCollectionBuilder
      attr_reader :metadata, :decisions

      # metadata: Hash with keys (all optional except source):
      #   source          — String (e.g. "OIML Conference Secretariat")
      #   meeting_urn     — String
      #   city            — String (UN/LOCODE)
      #   country_code    — String (ISO 3166-1 alpha-2)
      #   title_localized — Array<Hash {language_code, title}>
      def initialize(metadata:)
        @metadata = metadata
        @decisions = []
      end

      # Append a decision.
      #   identifier      — Array<Hash {prefix, number}>
      #   doi             — String
      #   urn             — String
      #   agenda_item     — String (label like "14.2")
      #   dates           — Array<Hash {date, type}>
      #   localizations   — Array<Hash {language_code, title, subject,
      #                     considerations[], actions[], approvals[]}>
      def add_decision(identifier:, doi:, urn:, agenda_item: nil, dates: [], localizations: [])
        @decisions << {
          "identifier" => identifier,
          "doi" => doi,
          "urn" => urn,
          "agenda_item" => agenda_item,
          "dates" => dates,
          "localizations" => localizations,
        }
        self
      end

      def build
        require "edoxen"
        Edoxen::DecisionCollection.new(
          metadata: build_metadata,
          decisions: decisions.map { |h| build_decision(h) },
        )
      end

      def to_yaml
        build.to_yaml
      end

      private

      def build_metadata
        require "edoxen"
        m = Edoxen::DecisionMetadata.new
        m.source = metadata["source"] if metadata["source"]
        m.meeting_urn = metadata["meeting_urn"] if metadata["meeting_urn"]
        m.city = metadata["city"] if metadata["city"]
        m.country_code = metadata["country_code"] if metadata["country_code"]
        if metadata["title_localized"]
          m.title_localized = metadata["title_localized"].map do |t|
            Edoxen::Localization.new(
              language_code: t["language_code"],
              title: t["title"],
            )
          end
        end
        m
      end

      def build_decision(hash)
        require "edoxen"
        Edoxen::Decision.new(
          identifier: hash["identifier"].map { |i| Edoxen::StructuredIdentifier.new(prefix: i["prefix"], number: i["number"]) },
          doi: hash["doi"],
          urn: hash["urn"],
          agenda_item: hash["agenda_item"]&.to_s,
          dates: hash["dates"].map { |d| Edoxen::DecisionDate.new(date: d["date"], type: d["type"]) },
          localizations: hash["localizations"].map { |loc| build_localization(loc) },
        )
      end

      def build_localization(loc)
        require "edoxen"
        Edoxen::Localization.new(
          language_code: loc["language_code"],
          title: loc["title"],
          subject: loc["subject"],
          considerations: (loc["considerations"] || []).map { |c| build_consideration(c) },
          actions: (loc["actions"] || []).map { |a| build_action(a) },
          approvals: (loc["approvals"] || []).map { |ap| build_approval(ap) },
        )
      end

      def build_consideration(c)
        require "edoxen"
        params = { message: c["message"] }
        params[:date_effective] = Edoxen::DecisionDate.new(date: c["date_effective"]["date"], type: c["date_effective"]["type"]) if c["date_effective"]
        Edoxen::Consideration.new(params)
      end

      def build_action(a)
        require "edoxen"
        params = { message: a["message"] }
        params[:type] = a["type"] if a["type"]
        params[:date_effective] = Edoxen::DecisionDate.new(date: a["date_effective"]["date"], type: a["date_effective"]["type"]) if a["date_effective"]
        Edoxen::Action.new(params)
      end

      def build_approval(ap)
        require "edoxen"
        Edoxen::Approval.new(message: ap["message"])
      end
    end
  end
end
