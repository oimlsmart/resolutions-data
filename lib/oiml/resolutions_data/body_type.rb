# frozen_string_literal: true

module Oiml
  module ResolutionsData
    # Classification of OIML meeting bodies. Edoxen's MEETING_TYPE enum
    # covers the *format* of a meeting (plenary, committee, conference,
    # etc.). OIML has three top-level bodies, each with its own
    # resolution numbering series, that we surface as a first-class
    # filter in the UI:
    #
    #   :ciml       — International Committee of Legal Metrology
    #   :conference — OIML Conference (general assembly of member states)
    #   :dc         — Development Council (advisory, 1980–2004)
    #
    # The edoxen `type` field is mapped separately; this enum only
    # classifies which OIML body a meeting belongs to.
    class BodyType
      CIML = :ciml
      CONFERENCE = :conference
      DC = :dc

      ALL = [CIML, CONFERENCE, DC].freeze

      # Slug prefixes used in canonical meeting identifiers and URNs.
      SLUG_PREFIXES = {
        CIML => "ciml",
        CONFERENCE => "conference",
        DC => "dc",
      }.freeze

      # Inverse of SLUG_PREFIXES.
      PREFIX_TO_BODY = SLUG_PREFIXES.invert.freeze

      # Display labels (English; the UI also carries French translations
      # in browser/src/data/translations.yaml).
      LABELS = {
        CIML => "CIML Meeting",
        CONFERENCE => "OIML Conference",
        DC => "OIML Development Council",
      }.freeze

      # Short badge labels shown in compact UI areas.
      BADGES = {
        CIML => "CIML",
        CONFERENCE => "CONF",
        DC => "DC",
      }.freeze

      # Derive the body type from a canonical meeting slug
      # (e.g. "ciml-44", "conference-12", "dc-1-2004").
      def self.from_slug(slug)
        return nil if slug.nil? || slug.to_s.empty?

        prefix = String(slug).split("-").first
        PREFIX_TO_BODY[prefix]
      end

      # All defined body types. Iteration order is stable: CIML,
      # Conference, DC.
      def self.all
        ALL
      end

      # Human-readable label for a body type.
      def self.label(body)
        LABELS[body]
      end

      # Compact badge text for a body type.
      def self.badge(body)
        BADGES[body]
      end

      # Slug prefix used in URNs and meeting slugs.
      def self.slug_prefix(body)
        SLUG_PREFIXES[body]
      end
    end
  end
end
