# frozen_string_literal: true

module Oiml
  module ResolutionsData
    autoload :BodyType,         "oiml/resolutions_data/body_type"
    autoload :IdentifierParser, "oiml/resolutions_data/identifier_parser"
    autoload :Version,          "oiml/resolutions_data/version"

    module Ocr
      autoload :MarkdownReader, "oiml/resolutions_data/ocr/markdown_reader"
    end

    module Pdf
      autoload :TextExtractor,  "oiml/resolutions_data/pdf/text_extractor"
    end
  end
end
