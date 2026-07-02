#!/usr/bin/env ruby
# frozen_string_literal: true

# One-shot: stamp every resolutions/*.yaml with metadata.meeting_urn.
#
# The meeting_urn joins each per-language resolution file to its
# parent meeting YAML (see TODO.complete/03-resolution-meeting-cross-link.md).
#
# Derivation:
#   ciml-39-decisions-en      → urn:oiml:ciml:meeting:ciml-39
#   ciml-43-resolutions-bilingual-fr → urn:oiml:ciml:meeting:ciml-43
#   conference-12-decisions-fr → urn:oiml:conference:meeting:conference-12
#
# Idempotent: re-running is a no-op on already-stamped files.

require "yaml"

ROOT = File.expand_path("..", __dir__)
DIR  = File.join(ROOT, "resolutions")

def meeting_urn_for(source_file)
  if source_file =~ /\Aciml-(\d+)-/ || source_file =~ /\A(\d+)CIML-/ || source_file =~ /\A(\d+)_ciml/
    "urn:oiml:ciml:meeting:ciml-#{$1}"
  elsif source_file =~ /\Aconference-(\d+)-/
    "urn:oiml:conference:meeting:conference-#{$1}"
  else
    raise "unknown source_file shape: #{source_file}"
  end
end

files = Dir.glob(File.join(DIR, "*.yaml")).reject { |p| File.basename(p).start_with?("_") }
stamped = 0
unchanged = 0
files.each do |path|
  raw = File.read(path)
  preamble = raw[/\A.*?(?=^---\s*$)/m] || ""
  body = raw[(preamble.length)..]

  data = YAML.safe_load(body, permitted_classes: [Date, Time, DateTime])
  unless data.is_a?(Hash) && data["resolutions"]
    warn "  skip #{File.basename(path)}: no resolutions key"
    next
  end

  source_file = File.basename(path, ".yaml")
  urn = meeting_urn_for(source_file)

  meta = (data["metadata"] ||= {})
  if meta["meeting_urn"] == urn
    unchanged += 1
    next
  end
  meta["meeting_urn"] = urn

  File.write(path, preamble + "---\n" + YAML.dump(data).sub(/\A---\s*\n/, ""))
  stamped += 1
end

puts "Stamped #{stamped} file(s); #{unchanged} already had the right URN."
