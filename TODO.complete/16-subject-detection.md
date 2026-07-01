# 16 — Item 3: subject detection fix

## Symptom
"Some resolutions are missing 'The Committee' in their text."

## Root cause
`scripts/author_yaml.rb` `extract_subject()` (around line 509)
matches the subject marker only when it appears alone on a line:

```ruby
def self.extract_subject(body, lang)
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
```

The `\A...\z` anchors require the line to be EXACTLY the subject
marker — no leading whitespace, no trailing comma variations, no
period at end. OCR output frequently:
- Adds leading whitespace ("    The Committee,")
- Wraps the marker with surrounding blank lines
- Inserts zero-width spaces (U+200B) from PDF extraction
- Lower-cases the first letter ("the Committee,")

## Proposed fix

1. **Strip and normalize before matching**: `.strip.gsub(/\s+/, ' ')`
   on each line; lowercase comparison.
2. **Permit trailing period/comma/semicolon**: relax the anchor from
   `\AThe Committee,?\z` to `\AThe Committee[,.;]?\z`.
3. **Add FR variants**: "Le Comité," (with acute é vs e), "Le Bureau,"
   for resolutions where the Bureau is the actor.
4. **Return a typed SubjectKind enum** instead of free-form strings.
   Today the function returns either "CIML" / "OIML Conference" /
   "Conférence OIML" — three different strings for two concepts.
   Should return `:committee | :conference | :bureau | :unknown`
   and let the renderer look up the localized label.

## Schema impact
- Add a `SubjectKind` enum to edoxen.yaml (committee / conference /
  bureau / council / unknown).
- Resolution.localization.subject becomes either a string OR a
  SubjectKind enum.
- Browser renders the enum via a lookup table
  (`subject-kinds.yaml`).

## Files touched
- `scripts/author_yaml.rb` — extract_subject + subject-strip
- `~/src/mn/edoxen/schema/edoxen.yaml` — add SubjectKind $def
- `browser/src/data/subject-kinds.yaml` — new file
- `browser/src/data/subjectKinds.ts` — new wrapper

## Verification
- Run author against all 28 meeting YAMLs.
- Grep for `subject: OIML Conference` and `subject: CIML` and confirm
  the count is what's expected (~1,515 rows, no `(Untitled)`
  fallbacks).
- Audit 5 random CIML 39–42 narrative resolutions manually.
