# frozen_string_literal: true

module Oiml
  module ResolutionsData
    # Parse and emit OIML structured identifiers in the form
    # `<prefix>/<year>/<sequence>[-<suffix>]`.
    #
    # Examples:
    #   "CIML/2009/1"             → prefix "CIML",  number "2009/1"
    #   "Conference/2004/9"       → prefix "Conference", number "2004/9"
    #   "DC/2004/1"               → prefix "DC",    number "2004/1"
    #   "CIML/2009/1-acclaim-1"   → prefix "CIML",  number "2009/1-acclaim-1"
    #
    # The "number" segment is what edoxen's StructuredIdentifier stores;
    # the prefix is the OIML body (CIML, Conference, DC).
    class IdentifierParser
      ACCLAMATION_RE = /-acclaim-\d+\z/i.freeze
      private_constant :ACCLAMATION_RE

      # A parsed identifier. Behaves like a value object — equality by
      # prefix + number.
      class Result
        attr_reader :prefix, :number

        def initialize(prefix:, number:)
          @prefix = prefix
          @number = number
        end

        def to_h
          { prefix: prefix, number: number }
        end

        def ==(other)
          other.is_a?(self.class) && other.prefix == prefix && other.number == number
        end
        alias eql? ==

        def hash
          [prefix, number].hash
        end

        # Render as `<prefix>/<number>`.
        def to_s
          "#{prefix}/#{number}"
        end

        # True if this identifier ends with an acclamation suffix
        # (`-acclaim-N`). Acclamations don't have a numbered agenda item.
        def acclamation?
          !!(number =~ ACCLAMATION_RE)
        end

        # Agenda-item label derived from the number segment.
        # "2009/1"            → "1"
        # "2025/14.2"         → "14.2"
        # "2009/1-acclaim-1"  → nil (acclamation has no agenda item)
        # "2004/9"            → "9"
        def agenda_label
          return nil if acclamation?
          return nil unless number =~ %r{\d{4}/(.+)\z}

          Regexp.last_match(1)
        end
      end

      # Parse a display identifier of the form "<prefix>/<number>" into
      # a Result. Returns nil for malformed input.
      def self.parse(identifier)
        return nil if identifier.nil? || identifier.to_s.strip.empty?

        parts = identifier.to_s.split("/", 2)
        return nil if parts.size != 2 || parts[0].empty? || parts[1].empty?

        Result.new(prefix: parts[0], number: parts[1])
      end

      # Convenience: extract the agenda-item label from an identifier
      # string, or nil if the identifier is an acclamation or malformed.
      def self.agenda_label(identifier)
        parsed = parse(identifier)
        parsed ? parsed.agenda_label : nil
      end

      # Convenience: true if the identifier string carries an
      # acclamation suffix.
      def self.acclamation?(identifier)
        parsed = parse(identifier)
        parsed ? parsed.acclamation? : false
      end
    end
  end
end
