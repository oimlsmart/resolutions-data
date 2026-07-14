# frozen_string_literal: true

module Oiml
  module ResolutionsData
    # Build an `Edoxen::DecisionCollection` instance in the v1.0
    # per-field LocalizedString shape.
    #
    # v1.0 differences from v2.x:
    # - No `localizations[]` collection on Decision.
    # - Each translatable field (title, subject, message, considering)
    #   is its own LocalizedString[] array.
    # - Actions/considerations/approvals are top-level collections;
    #   their `message` field is a LocalizedString[].
    # - DecisionMetadata.title is a LocalizedString[] (no title_localized).
    class DecisionCollectionBuilder
      attr_reader :metadata, :decisions

      # metadata: Hash with keys (all optional):
      #   source       — String
      #   meeting_urn  — String
      #   city         — String (UN/LOCODE)
      #   country_code — String (ISO alpha-2)
      #   titles       — Array<Hash {spelling, value}>
      def initialize(metadata:)
        @metadata = metadata
        @decisions = []
      end

      # Append a decision in v1.0 per-field shape.
      #   identifier    — Array<Hash {prefix, number}>
      #   doi, urn      — String
      #   agenda_item   — String
      #   dates         — Array<Hash {date, type}>
      #   titles        — Array<Hash {spelling, value}> (per-field LocalizedString)
      #   subjects      — Array<Hash {spelling, value}> (optional)
      #   actions       — Array<Hash {type, message: [{spelling, value}], date_effective?}>
      #   considerations — same shape as actions
      #   approvals     — same shape as actions
      def add_decision(identifier:, doi:, urn:, agenda_item: nil, dates: [],
                       titles: [], subjects: [],
                       actions: [], considerations: [], approvals: [])
        @decisions << {
          "identifier" => identifier,
          "doi" => doi,
          "urn" => urn,
          "agenda_item" => agenda_item,
          "dates" => dates,
          "titles" => titles,
          "subjects" => subjects,
          "actions" => actions,
          "considerations" => considerations,
          "approvals" => approvals,
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
        if metadata["titles"]&.any?
          m.title = metadata["titles"].map { |t| build_localized_string(t) }
        end
        m
      end

      def build_decision(h)
        require "edoxen"
        params = {
          identifier: h["identifier"].map { |i| Edoxen::StructuredIdentifier.new(prefix: i["prefix"], number: i["number"]) },
          doi: h["doi"],
          urn: h["urn"],
          dates: h["dates"].map { |d| Edoxen::DecisionDate.new(date: d["date"], type: d["type"]) },
        }
        params[:agenda_item] = h["agenda_item"]&.to_s if h["agenda_item"]
        params[:title] = h["titles"].map { |t| build_localized_string(t) } if h["titles"]&.any?
        params[:subject] = h["subjects"].map { |t| build_localized_string(t) } if h["subjects"]&.any?
        params[:actions] = h["actions"].map { |a| build_action_like(a, Edoxen::Action) } if h["actions"]&.any?
        params[:considerations] = h["considerations"].map { |c| build_action_like(c, Edoxen::Consideration) } if h["considerations"]&.any?
        params[:approvals] = h["approvals"].map { |ap| build_action_like(ap, Edoxen::Approval) } if h["approvals"]&.any?
        Edoxen::Decision.new(params)
      end

      def build_localized_string(h)
        require "edoxen"
        Edoxen::LocalizedString.new(spelling: h["spelling"], value: h["value"])
      end

      # Build an Action / Consideration / Approval. In v1.0 the `message`
      # field on each is a LocalizedString[].
      def build_action_like(h, klass)
        require "edoxen"
        params = {}
        params[:type] = h["type"] if h["type"]
        if h["message"].is_a?(Array)
          params[:message] = h["message"].map { |m| build_localized_string(m) }
        elsif h["message"]
          params[:message] = [Edoxen::LocalizedString.new(spelling: "eng", value: h["message"])]
        end
        if h["date_effective"]
          params[:date_effective] = Edoxen::DecisionDate.new(
            date: h["date_effective"]["date"],
            type: h["date_effective"]["type"],
          )
        end
        klass.new(params)
      end
    end
  end
end
