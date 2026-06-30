#!/usr/bin/env ruby
# frozen_string_literal: true

# Parse OIML resolution OCR markdown into Edoxen YAML.
#
# Handles three OCR shapes (see TODO.work/07-author-plan.md):
#   A. Modern:    "## Resolution Conference/YYYY/NN"   (CIML 44+, Conf 14+)
#   B. Older:     "## Resolution no.N"                 (CIML 43, Conf 13)
#   C. Decisions: "## N <section title>"               (CIML 39–42) — DEFERRED
#
# Bilingual PDFs (CIML 43, Conf 13) are split at the "# Résolutions" header
# into EN + FR halves; each half is parsed and emitted as a separate YAML.

require "yaml"
require "fileutils"
require "digest"

module ResolutionsData
  module Author
    ROOT       = File.expand_path("..", __dir__)
    OCR_DIR    = File.join(ROOT, "reference-docs", ".ocr", "md")
    OUT_DIR    = File.join(ROOT, "resolutions")
    MANIFEST   = File.join(ROOT, "scripts", "manifest.yaml")
    PENDING    = File.join(OUT_DIR, "_pending_review.txt")

    SCHEMA_URL = "https://raw.githubusercontent.com/metanorma/edoxen/refs/heads/main/schema/edoxen.yaml"

    # (verb-prefix, edoxen-type). Order matters — longer prefixes first.
    CONSIDERATION_PREFIXES = [
      ["Having regard to",   "having_regard_to"],
      ["Having regard",      "having_regard"],
      ["Noting that",        "noting"],
      ["Noting",             "noting"],
      ["Recalling",          "recalling"],
      ["Considering that",   "considering"],
      ["Considering",        "considering"],
    ].freeze

    ACTION_PREFIXES = [
      ["Gives its definitive discharge", "gives_discharge"],
      ["Gives discharge",                "gives_discharge"],
      ["Re-affirms",                     "reaffirms"],
      ["Reaffirms",                      "reaffirms"],
      ["Resolves that",                  "resolves"],
      ["Resolves:",                      "resolves"],
      ["Resolves",                       "resolves"],
      ["Approves",                       "approves"],
      ["Elects",                         "elects"],
      ["Endorses",                       "endorses"],
      ["Thanks",                         "thanks"],
      ["Instructs",                      "instructs"],
      ["Requests",                       "requests"],
      ["Decides",                        "decides"],
      ["Charges",                        "charges"],
      ["Supports",                       "supports"],
      ["Rescinds",                       "rescinds"],
      ["Acknowledges",                   "acknowledges"],
      ["Notes",                        "notes"],
      ["Takes note",                   "notes"],
      ["Welcomes",                     "welcomes"],
      ["Renews",                       "renews"],
      # Past-tense forms used in older formal resolutions (CIML 43-48, ~2008-2013)
      ["Approved",                     "approves"],
      ["Elected",                      "elects"],
      ["Endorsed",                     "endorses"],
      ["Resolved",                     "resolves"],
      ["Thanked",                      "thanks"],
      ["Instructed",                   "instructs"],
      ["Requested",                    "requests"],
      ["Decided",                      "decides"],
      ["Charged",                      "charges"],
      ["Supported",                    "supports"],
      ["Rescinded",                    "rescinds"],
      ["Acknowledged",                 "acknowledges"],
      ["Noted",                        "notes"],
      ["Welcomed",                     "welcomes"],
      ["Renewed",                      "renews"],
    ].freeze

    # French equivalents
    FR_CONSIDERATION_PREFIXES = [
      ["Vu",               "having_regard_to"],
      ["Attendu",          "having_regard_to"],
      ["Notant",           "noting"],
      ["Prenant note",     "noting"],
      ["Rappelant",        "recalling"],
      ["Considérant",      "considering"],
    ].freeze

    FR_ACTION_PREFIXES = [
      ["Approuve",     "approves"],
      ["Élit",         "elects"],
      ["Elit",         "elects"],
      ["Soutient",     "endorses"],
      ["Décide que",   "decides"],
      ["Décide",       "decides"],
      ["Charge",       "charges"],
      ["Demande",      "requests"],
      ["Remercie",     "thanks"],
      ["Résout",       "resolves"],
      ["Resout",       "resolves"],
      ["Notes",        "notes"],
      ["Prend note",   "notes"],
      ["Accueille",    "welcomes"],
    ].freeze

    # Extra EN verbs seen in CIML minutes-style resolutions
    EXTRA_EN_ACTION_PREFIXES = [
      ["Notes",         "notes"],
      ["Takes note",    "notes"],
      ["Welcomes",      "welcomes"],
      ["Instructs",     "instructs"],  # also captured above; first match wins
      ["Renews",        "renews"],
      ["Endorses",      "endorses"],   # duplicate to be safe
    ].freeze

    def self.run
      FileUtils.mkdir_p(OUT_DIR)
      sources = YAML.load_file(MANIFEST)["sources"]
      stats = Hash.new(0)
      pending = []

      sources.each do |src|
        slug = src["slug"]
        md_path = File.join(OCR_DIR, "#{slug}.md")
        unless File.exist?(md_path)
          warn "  SKIP #{slug}: no OCR markdown"
          next
        end
        md = File.read(md_path)

        # Bilingual: split at the French "Résolutions" header
        if src["lang"] == "bilingual"
          en, fr = split_bilingual(md)
          emit_one(src, slug + "-en", en, :en, stats, pending)
          emit_one(src, slug + "-fr", fr, :fr, stats, pending)
        else
          lang_sym = src["lang"] == "fr" ? :fr : :en
          emit_one(src, slug, md, lang_sym, stats, pending)
        end
      end

      File.write(PENDING, pending.join("\n")) unless pending.empty?

      puts
      puts "Summary:"
      puts "  YAML files emitted:    #{stats[:emitted]}"
      puts "  Resolutions parsed:    #{stats[:resolutions]}"
      puts "  Decisions deferred:    #{stats[:deferred]}  (CIML 39–42 narrative style)"
      puts "  Pending-review notes:  #{pending.size}  → #{PENDING}"
      exit 1 if stats[:error] > 0
    end

    def self.emit_one(src, out_slug, md, lang, stats, pending)
      resolutions, deferred = parse(md, src, lang)

      # Fall back to narrative parser for CIML 39–42-style "DECISIONS" docs
      # (no formal "## Resolution" headers, but "## DECISIONS" + numbered sections).
      if resolutions.empty? && md =~ /#*\s*D[ÉE]CISIONS\b/i
        resolutions, deferred = parse_narrative(md, src, lang)
      end

      stats[:resolutions] += resolutions.size
      stats[:deferred]   += deferred
      stats[:emitted]    += 1 unless resolutions.empty?
      if resolutions.empty?
        pending << "#{out_slug}: parser found 0 resolutions (deferred)"
        return
      end
      out_path = File.join(OUT_DIR, "#{out_slug}.yaml")
      File.write(out_path, render_collection(src, out_slug, lang, resolutions))
      puts "  ok   #{out_slug}  (#{resolutions.size} resolutions)"
    rescue => e
      stats[:error] += 1
      warn "  FAIL #{out_slug}: #{e.class}: #{e.message}"
      pending << "#{out_slug}: ERROR #{e.class}: #{e.message}"
    end

    # Split a bilingual markdown doc at the "# Résolutions" (FR) header.
    # Returns [en_md, fr_md]. If the header isn't found, returns [md, ""].
    def self.split_bilingual(md)
      # The French half starts at a top-level "# Résolutions" header.
      # Require the é in the regex so we don't split at the EN "# Resolutions".
      m = md.match(/\n#\s+Résolutions\b/)
      return [md, ""] unless m
      [md[0...m.begin(0)], md[m.begin(0)..]]
    end

    # Parse a single-language markdown stream into [resolutions, deferred_count].
    def self.parse(md, src, lang)
      res = []
      blocks = split_resolution_blocks(md)
      deferred = 0

      blocks.each do |(raw_header, body)|
        ident = parse_identifier(raw_header, src)
        if ident.nil?
          deferred += 1
          next
        end


        agenda_item = extract_agenda_item(body)
        subject_str = extract_subject(body, lang)
        date_str    = meeting_date(src)
        cleaned     = strip_meta_lines(body)
        cons, acts  = classify_body(cleaned, lang, date_str)
        title       = synthesize_title(acts)

        res << {
          "identifier"  => ident,
          "doi"         => compute_doi(src, ident),
          "urn"         => compute_urn(src, ident),
          "subject"     => subject_str,
          "title"       => title,
          "dates"       => [{ "start" => meeting_date(src), "kind" => "decision" }],
          "agenda_item" => agenda_item,
          "considerations" => cons,
          "actions"     => acts,
          "approvals"   => [],
        }
      end

      [res, deferred]
    end


    # Parse narrative "DECISIONS" format (CIML 39–42, 2004–2007). Each numbered
    # section becomes a resolution; each body paragraph starting with
    # "The Committee [verb]" becomes an action.
    def self.parse_narrative(md, src, lang)
      res = []
      date_str = meeting_date(src)

      # Slice from "## DECISIONS" to either the "ANNEX" section or end of file
      if (m = md.match(/(^|\n)#+\s+D[ÉE]CISIONS\b/i))
        body = md[m.end(0)..]
      else
        body = md
      end
      # Cut at ANNEX
      if (m = body.match(/\n#\s+ANNEX\b/i))
        body = body[0...m.begin(0)]
      end

      current_header = nil
      current_body = []

      body.each_line do |line|
        if line =~ /\A##\s+(\d+(?:\.\d+)?)\.?\s+(.*)/
          res << build_narrative_resolution(current_header, current_body, src, date_str) if current_header
          current_header = [$1, $2.strip]
          current_body = []
        elsif current_header
          current_body << line
        end
      end
      res << build_narrative_resolution(current_header, current_body, src, date_str) if current_header

      [res, 0]
    end

    def self.build_narrative_resolution(header, body_lines, src, date_str)
      number, title = header
      kind_label = src["kind"] == "ciml" ? "CIML" : "Conference"
      identifier = "#{kind_label}/#{src['year']}/#{number}"

      paragraphs = body_lines.join.split(/\n\s*\n/).map(&:strip).reject(&:empty?)
      acts = []
      paragraphs.each do |para|
        clean = para.gsub(/\A[-*]\s+/, "")
        verb_type = classify_narrative_verb(clean)
        next unless verb_type
        msg = convert_tables(clean)
        acts << {
          "type"    => verb_type,
          "message" => msg,
          "dates"   => [{ "start" => date_str, "kind" => "effective" }],
        }
      end

      title_str = title.to_s.strip
      title_str = title_str[0...100] + "…" if title_str.size > 100

      {
        "identifier"     => identifier,
        "doi"            => compute_doi(src, identifier),
        "urn"            => compute_urn(src, identifier),
        "subject"        => "CIML",
        "title"          => title_str.empty? ? "(Untitled)" : title_str,
        "dates"          => [{ "start" => date_str, "kind" => "decision" }],
        "considerations" => [],
        "actions"        => acts,
        "approvals"      => [],
      }
    end

    NARRATIVE_VERBS = [
      ["took note",                  "notes"],
      ["takes note",                 "notes"],
      ["noted",                      "notes"],
      ["notes",                      "notes"],
      ["approved",                   "approves"],
      ["approves",                   "approves"],
      ["instructed",                 "instructs"],
      ["instructs",                  "instructs"],
      ["endorsed",                   "endorses"],
      ["endorses",                   "endorses"],
      ["thanked",                    "thanks"],
      ["thanks",                     "thanks"],
      ["decided",                    "decides"],
      ["decides",                    "decides"],
      ["renewed",                    "renews"],
      ["welcomed",                   "welcomes"],
      ["wishes",                     "wishes"],
      ["wished",                     "wishes"],
      ["set the deadline",           "sets"],
      ["requested",                  "requests"],
      ["gave its approval",          "approves"],
      ["expressed its appreciation", "thanks"],
    ].freeze

    FR_NARRATIVE_VERBS = [
      ["a approuv[ée]",          "approves"],
      ["approuve",               "approves"],
      ["a not[ée]",              "notes"],
      ["note",                   "notes"],
      ["a pris note",            "notes"],
      ["a charg[ée]",            "instructs"],
      ["a instruit",             "instructs"],
      ["a adopt[ée]",            "approves"],
      ["a soulign[ée]",          "notes"],
      ["a remerci[ée]",          "thanks"],
      ["a d[ée]cid[ée]",         "decides"],
      ["a renouvel[ée]",         "renews"],
      ["a accueilli",            "welcomes"],
      ["a pri[ée]",              "requests"],
      ["a exprim[ée]",           "notes"],
      ["a fix[ée]",              "sets"],
      ["a approuv[ée] le principe", "approves"],
      ["a donn[ée] son accord",  "approves"],
      ["a souhait[ée]",          "wishes"],
    ].freeze

    def self.classify_narrative_verb(para)
      after = nil
      if para =~ /\AThe Committee\s+/i
        after = $'.strip
      elsif para =~ /\ALe Comit[ée]\s+/i
        after = $'.strip
      else
        return nil
      end
      # Try French verbs first if the para is in French
      if para =~ /\ALe Comit[ée]/i
        FR_NARRATIVE_VERBS.each do |(prefix, type)|
          return type if after.downcase.start_with?(prefix)
        end
        return "notes"
      end
      NARRATIVE_VERBS.each do |(prefix, type)|
        return type if after.downcase.start_with?(prefix)
      end
      "notes"
    end
    # Find resolution headers and slice the body that follows each one.
    # Returns array of [header_line, body_until_next_header].
    def self.split_resolution_blocks(md)
      lines = md.split("\n")
      blocks = []
      current_header = nil
      current_body   = []

      lines.each do |line|
        if resolution_header?(line)
          blocks << [current_header, current_body.join("\n")] if current_header
          current_header = line
          current_body   = []
        elsif current_header
          current_body << line
        end
      end
      blocks << [current_header, current_body.join("\n")] if current_header
      blocks
    end

    # A line is a resolution header if it matches:
    #   "## Resolution Conference/YYYY/NN"
    #   "## Resolution CIML/YYYY/NN"
    #   "## Resolution no.N"        (older)
    #   "## Résolution n° N"        (FR)
    def self.resolution_header?(line)
      # Markdown header form: "## Resolution ..." / "## Résolution ..."
      return true if line =~ /\A\#{1,6}\s+(Resolution|R[ée]solution)\b/i
      # Plain-text form (no ## prefix): "Resolution no. 2013/1" / "Résolution n° 1".
      # Require an identifier tail so we don't snag body prose.
      return true if line =~ /\A\s*(Resolution|R[ée]solution)\s+(?:(?:Conference|CIML)\/\d{4}\/\d+[a-z]?|\d{4}\/\d+[a-z]?|no\.?\s*\d+[a-z]?|n[°o]\s*\d+[a-z]?|\d+[a-z]?)/i
      false
    end

    # Parse identifier from header. Returns string like "Conference/2025/01"
    # or "CIML/2022/10" or "<year>/<seq>" for older format. nil if unparsable.
    def self.parse_identifier(header, src)
      return nil unless header
      kind_label = src["kind"] == "ciml" ? "CIML" : "Conference"

      # 1. Modern with body prefix: "Conference/YYYY/NN" or "CIML/YYYY/NN"
      if m = header.match(/(Conference|CIML)\/(\d{4})\/(\d+[a-z]?)/i)
        return "#{kind_label}/#{m[2]}/#{m[3]}"
      end

      # 2. Year/sequence anywhere in the header: "Resolution 2019/19", "Resolution no. 2016/3"
      if m = header.match(/\b(\d{4})\/(\d+[a-z]?)\b/)
        return "#{kind_label}/#{m[1]}/#{m[2]}"
      end

      # 3. Older: "Resolution no.N" / "Résolution n° N" — use meeting year from manifest
      if m = header.match(/n[°o]\.?\s*(\d+[a-z]?)\b/i)
        return "#{kind_label}/#{src['year']}/#{m[1]}"
      end

      # 4. Bare sequence: "Resolution 1" / "Résolution 4" — use meeting year from manifest
      if m = header.match(/\b(?:Resolution|R[ée]solution)\s+(\d+[a-z]?)\b/)
        return "#{kind_label}/#{src['year']}/#{m[1]}"
      end

      nil
    end

    def self.extract_agenda_item(body)
      # EN: "Agenda item 2.3"  /  "[Agenda item 2.3]"
      m = body.match(/^\s*\[?\s*Agenda item\s+([\d\.]+)/i)
      return m[1] if m
      # FR: "[Point 2.2 de l'ordre du jour]"  /  "Point 2.2 de l'ordre du jour"
      m = body.match(/^\s*\[?\s*Point\s+([\d\.]+)/i)
      m && m[1]
    end

    def self.extract_subject(body, lang)
      # Look for "The Conference," or "The Committee," on its own line.
      body.each_line do |line|
        line = line.strip
        return "OIML Conference" if line =~ /\AThe Conference,?\z/i
        return "CIML"            if line =~ /\AThe Committee,?\z/i
        return "Conférence OIML" if line =~ /\ALa Conf[ée]rence,?\z/i
        return "CIML"            if line =~ /\ALe Comit[ée],?\z/i
      end
      # Fallback: derive from lang
      lang == :fr ? "Conférence OIML" : "OIML Conference"
    end

    # Drop metadata lines (agenda item, subject marker) from body.
    def self.strip_meta_lines(body)
      out = []
      body.each_line do |line|
        stripped = line.strip
        next if stripped =~ /\AAgenda item\b/i
        next if stripped =~ /\AThe (Conference|Committee),?\z/i
        next if stripped =~ /\ALa Conf[ée]rence,?\z/i
        next if stripped =~ /\ALe Comit[ée],?\z/i
        out << line
      end
      out.join
    end

    # Walk the body and group lines into consideration/action blocks by
    # their leading verb. Returns [considerations, actions] arrays of
    # { "type" => ..., "message" => ..., "dates" => [...] }.
    def self.classify_body(body, lang, date_str)
      cons_prefixes = lang == :fr ? FR_CONSIDERATION_PREFIXES : CONSIDERATION_PREFIXES
      act_prefixes  = lang == :fr ? FR_ACTION_PREFIXES       : ACTION_PREFIXES

      blocks = group_by_leading_verb(body)
      cons = []
      acts = []
      blocks.each do |(verb_line, body_lines)|
        type, kind = classify_verb(verb_line, cons_prefixes, act_prefixes)
        next unless type
        msg = reconstruct_message(verb_line, body_lines)
        msg = convert_tables(msg)
        msg = msg.strip
        next if msg.empty?
        entry = {
          "type"    => type,
          "message" => msg,
          "dates"   => [{ "start" => date_str, "kind" => "effective" }],
        }
        if kind == "consideration"
          cons << entry
        else
          acts << entry
        end
      end
      [cons, acts]
    end

    # Split body into [verb_line, continuation_lines] groups. A new group
    # starts whenever a line begins with a known verb prefix. Non-verb lines
    # attach to the most recent group.
    # Optional "The Committee / The Conference / The Bureau / Le Comité / ..."
    # prefix that appears in older formal resolutions where the subject and
    # the verb are on the same line (no comma after the subject).
    SUBJECT_LEAD = /
      \A
      (?:The\s+(?:Committee|Conference|Bureau|Council)\s+
       |Le\s+Comit[ée]\s+
       |La\s+Conf[ée]rence\s+)
    /ix

    def self.group_by_leading_verb(body)
      cons_prefixes = CONSIDERATION_PREFIXES + FR_CONSIDERATION_PREFIXES
      act_prefixes  = ACTION_PREFIXES + FR_ACTION_PREFIXES
      all_prefixes  = (cons_prefixes + act_prefixes).map(&:first).sort_by(&:length).reverse
      # Build one regex that allows an optional subject lead before the verb.
      verb_alternatives = all_prefixes.map { |p| Regexp.escape(p) }.join("|")
      verb_with_subject_re = /\A(?:The\s+(?:Committee|Conference|Bureau|Council)\s+|Le\s+Comit[ée]\s+|La\s+Conf[ée]rence\s+)?(?:#{verb_alternatives})/i

      groups = []
      current_verb_line = nil
      current_body = []

      body.each_line do |line|
        next if line.strip.empty?
        next if line =~ /\A#+\s/
        if line.strip =~ verb_with_subject_re
          groups << [current_verb_line, current_body] if current_verb_line
          current_verb_line = line
          current_body = []
        elsif current_verb_line
          current_body << line
        end
      end
      groups << [current_verb_line, current_body] if current_verb_line
      groups
    end

    def self.classify_verb(verb_line, cons_prefixes, act_prefixes)
      return [nil, nil] unless verb_line
      # Strip a leading subject marker so "The Committee approved" classifies
      # the same as "approved".
      stripped = verb_line.strip.sub(SUBJECT_LEAD, "")
      stripped_lower = stripped.downcase
      cons_prefixes.each do |(prefix, type)|
        return [type, "consideration"] if stripped_lower.start_with?(prefix.downcase)
      end
      act_prefixes.each do |(prefix, type)|
        return [type, "action"] if stripped_lower.start_with?(prefix.downcase)
      end
      [nil, nil]
    end

    def self.reconstruct_message(verb_line, body_lines)
      # Preserve the leading verb line + all continuation lines.
      # Strip trailing blank lines.
      ([verb_line] + body_lines).join.strip
    end

    # Convert any HTML <table>...</table> blocks to AsciiDoc |=== tables.
    def self.convert_tables(text)
      text.gsub(/<table[^>]*>.*?<\/table>/m) do |html|
        html_table_to_asciidoc(html)
      end
    end

    def self.html_table_to_asciidoc(html)
      rows = []
      html.scan(/<tr[^>]*>(.*?)<\/tr>/m) do |(tr_inner)|
        cells = tr_inner.scan(/<t[dh][^>]*>(.*?)<\/t[dh]>/m).flatten
        rows << cells.map { |c| c.strip.gsub(/\s+/, " ") }
      end
      return "" if rows.empty?
      cols = rows.map(&:size).max
      out  = ["|==="]
      rows.each do |row|
        cells = row.fill("", row.size...cols)
        out << "| " + cells.join(" | ")
      end
      out << "|==="
      out.join("\n")
    end

    # Derive a short title from the first action: take the verb stem and the
    # first sentence (truncated to ~12 words).
    def self.synthesize_title(actions)
      return "(Untitled)" if actions.empty?
      msg = actions.first["message"].to_s.strip
      # Cut at first sub-item list marker (a), b), ...) — those belong in the body.
      msg = msg.sub(/\s+\(?[a-z]\)\s.*\z/m, "")
      # Take the first 14 whitespace-separated tokens (resists "M." truncation).
      words = msg.split
      title = words.first(14).join(" ")
      title = title.sub(/[,;:]\z/, "")
      title = title[0...100] + "…" if title.size > 100
      title.empty? ? "(Untitled)" : title
    end

    def self.meeting_date(src)
      # Use the real meeting date extracted from the OCR cover page if present
      # (see scripts/extract_dates.rb). Fall back to YYYY-01-01 placeholder.
      src["date_start"] || "#{src['year']}-01-01"
    end

    # Per the URN spec at ~/src/oimlsmart/smart/data/oiml-urn-specification.adoc:
    #   urn:oiml:doc:conf:resolution:<session>.<seq>
    #   urn:oiml:doc:ciml:resolution:<year>-<seq>
    def self.compute_urn(src, identifier)
      kind, year, seq = parse_identifier_parts(identifier, src)
      seq_padded = pad_seq(seq)
      case kind
      when "Conference" then "urn:oiml:doc:conf:resolution:#{src['session']}.#{seq_padded}"
      when "CIML"       then "urn:oiml:doc:ciml:resolution:#{year}-#{seq_padded}"
      else "urn:oiml:doc:#{kind.downcase}:resolution:#{year}-#{seq_padded}"
      end
    end

    # Per user direction (TODO.cleanups/01-doi-urn.md):
    #   Conference: 10.63493/resolutions/conf<YYYY><NN>
    #   CIML:        10.63493/resolutions/ciml<YYYY><NN>
    def self.compute_doi(src, identifier)
      kind, year, seq = parse_identifier_parts(identifier, src)
      seq_padded = pad_seq(seq)
      prefix = kind == "Conference" ? "conf" : "ciml"
      "10.63493/resolutions/#{prefix}#{year}#{seq_padded}"
    end

    # identifier is "Conference/2025/01" or "CIML/2025/44" or "CIML/2004/2.1"
    def self.parse_identifier_parts(identifier, src)
      if identifier =~ /\A(Conference|CIML)\/(\d{4})\/(.+)\z/
        [$1, $2, $3]
      else
        # Fallback for unexpected shapes (narrative-era identifiers always
        # include the body prefix, so this should rarely fire)
        kind_label = src["kind"] == "ciml" ? "CIML" : "Conference"
        [kind_label, src["year"].to_s, identifier.to_s]
      end
    end

    # Zero-pad a sequence token to 2 digits if it's purely numeric.
    # Alphanumeric seqs (e.g. "4a") are preserved as-is.
    def self.pad_seq(seq)
      return seq if seq.to_s =~ /\A\d+\z/ && seq.to_s.length >= 2
      return seq.to_s.rjust(2, "0") if seq.to_s =~ /\A\d+\z/
      seq.to_s
    end

    def self.render_collection(src, out_slug, lang, resolutions)
      kind     = src["kind"]
      number   = src["kind"] == "ciml" ? src["meeting"] : src["session"]
      body     = src["kind"] == "ciml" ? "CIML Meeting" : "OIML Conference"
      urn_kind = src["kind"] == "ciml" ? "ciml" : "conference"
      if src["lang"] == "bilingual"
        ord = number_to_ordinal(number, lang)
        title = lang == :fr ? "Résolutions #{ord} #{body} (#{src['year']})" : "Resolutions of the #{ord} #{body} (#{src['year']})"
      else
        title = src["title"].to_s
      end
      venue = src["venue"]

      date_start = src["date_start"] || "#{src['year']}-01-01"
      date_end   = src["date_end"]   || date_start
      dates_yaml = if date_start == date_end
        "  dates:\n  - start: '#{date_start}'\n    kind: meeting"
      else
        "  dates:\n  - start: '#{date_start}'\n    end: '#{date_end}'\n    kind: meeting"
      end

      <<~YAML
        # yaml-language-server: $schema=#{SCHEMA_URL}
        # Auto-generated from reference-docs/.ocr/md/#{src['slug']}.md by scripts/author_yaml.rb
        # Source PDF: #{source_pdf_path(src)}
        # Meeting URN: urn:oiml:#{urn_kind}:meeting:#{out_slug}
        # Language: #{lang}
        ---
        metadata:
          title: #{yaml_escape(title)}
        #{dates_yaml}
          source: OIML #{kind == 'ciml' ? 'CIML' : 'Conference'} Secretariat (BIML)
          venue: #{yaml_escape(venue)}
          language: #{lang}
        resolutions:
      YAML
        .concat(resolutions.map { |r| render_resolution(r) }.join("\n"))
    end

    def self.render_resolution(r)
      indent = "  "
      lines = []
      lines << "#{indent}- identifier: #{yaml_escape(r['identifier'])}"
      lines << "#{indent}  doi: #{yaml_escape(r['doi'])}" if r["doi"]
      lines << "#{indent}  urn: #{yaml_escape(r['urn'])}" if r["urn"]
      lines << "#{indent}  subject: #{yaml_escape(r['subject'])}"
      lines << "#{indent}  title: #{yaml_escape(r['title'])}"
      lines << "#{indent}  dates:"
      r["dates"].each do |d|
        lines << "#{indent}  - start: '#{d['start']}'"
        lines << "#{indent}    kind: #{d['kind']}"
      end
      lines << "#{indent}  agenda_item: '#{r['agenda_item']}'" if r["agenda_item"]
      if r["considerations"].any?
        lines << "#{indent}  considerations:"
        r["considerations"].each { |c| lines << render_action_like(c, indent + "  ") }
      else
        lines << "#{indent}  considerations: []"
      end
      if r["actions"].any?
        lines << "#{indent}  actions:"
        r["actions"].each { |a| lines << render_action_like(a, indent + "  ") }
      else
        lines << "#{indent}  actions: []"
      end
      lines.join("\n")
    end

    def self.render_action_like(entry, indent)
      out = []
      out << "#{indent}- type: #{entry['type']}"
      out << "#{indent}  message: |"
      entry["message"].to_s.split("\n").each do |line|
        out << "#{indent}    #{line}"
      end
      out << "#{indent}  dates:"
      entry["dates"].each do |d|
        out << "#{indent}  - start: '#{d['start']}'"
        out << "#{indent}    kind: #{d['kind']}"
      end
      out.join("\n")
    end

    def self.source_pdf_path(src)
      kind_dir = src["kind"] == "ciml" ? "ciml" : "conferences"
      "reference-docs/#{kind_dir}/#{src['slug']}.pdf"
    end

    def self.number_to_ordinal(n, lang)
      return n.to_s unless n.is_a?(Integer)
      if lang == :fr
        n == 1 ? "1ère" : "#{n}e"
      else
        suf = case n % 100
              when 11..13 then "th"
              else case n % 10
                   when 1 then "st"
                   when 2 then "nd"
                   when 3 then "rd"
                   else "th"
                   end
              end
        "#{n}#{suf}"
      end
    end

    def self.yaml_escape(s)
      s = s.to_s
      # Quote if it contains special chars
      return s if s =~ /\A[A-Za-z0-9 _\-\/\.\(\)']+\.?\z/ && !(s =~ /\A\d/)
      s.inspect.gsub(/\A"|"\z/, '"')
    end
  end
end

ResolutionsData::Author.run if $PROGRAM_NAME == __FILE__
