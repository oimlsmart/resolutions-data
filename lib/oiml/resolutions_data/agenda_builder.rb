# frozen_string_literal: true

module Oiml
  module ResolutionsData
    # Build an `Edoxen::Agenda` instance from extracted agenda items.
    #
    # Wraps the model-construction logic so that scripts can stay
    # focused on parsing (PDF text, OCR markdown, Bulletin minutes)
    # without coupling themselves to the Edoxen model API. If the
    # Edoxen gem evolves (new required attributes, renamed enums),
    # only this file changes.
    class AgendaBuilder
      # An "a"-labelled preamble item (Opening addresses, Roll-call,
      # Approval of the agenda) sorts before numeric "1" so we keep
      # alphabetic labels for those.
      PREAMBLE_LABEL_BASE = "a".freeze
      private_constant :PREAMBLE_LABEL_BASE

      attr_reader :meeting_urn, :identifier, :items

      # meeting_urn: full URN like "urn:oiml:ciml:meeting:ciml-60"
      # identifier: Edoxen::StructuredIdentifier[] (e.g. CIML/60)
      def initialize(meeting_urn:, identifier:)
        @meeting_urn = meeting_urn
        @identifier = identifier
        @items = []
      end

      # Append a numbered agenda item.
      #   label   — "1", "14.2", "a"
      #   title   — agenda item title
      #   kind    — edoxen AgendaItemKind enum (numbered / opening /
      #             closing / aob / header / unnumbered)
      #   outcome — edoxen AgendaItemOutcome enum (discussed / resolved /
      #             adopted / deferred / withdrawn / carried / negatived)
      def add_item(label:, title:, kind: "numbered", outcome: "discussed")
        items << {
          "label" => label,
          "title" => title,
          "kind" => classify_kind(title, kind),
          "outcome" => outcome,
        }
        self
      end

      # Build the Edoxen::Agenda instance.
      def build
        require "edoxen"
        Edoxen::Agenda.new(
          identifier: identifier,
          status: items.empty? ? "draft" : "final",
          items: items.map { |h| build_agenda_item(h) },
        )
      end

      # Serialize to YAML for writing to agendas/<slug>.yaml.
      def to_yaml
        build.to_yaml
      end

      private

      def build_agenda_item(hash)
        Edoxen::AgendaItem.new(
          label: hash["label"].to_s,
          title: [Edoxen::LocalizedString.new(spelling: "eng", value: hash["title"])],
          kind: hash["kind"],
          outcome: hash["outcome"],
        )
      end

      # Refine the kind based on the title text. The caller may pass
      # a default kind (e.g. "numbered"); the title text can override
      # it for Opening/Closing/AOB items.
      def classify_kind(title, default)
        t = title.to_s.downcase
        return "opening" if t =~ /\b(opening|welcome|allocution|adresse|roll.call|quorum)\b/i
        return "closing" if t =~ /\b(closing|cl[oô]ture|farewell|date and place of the next)\b/i
        return "aob" if t =~ /\b(any other business|aob|questions diverses|divers)\b/i
        default
      end
    end
  end
end
