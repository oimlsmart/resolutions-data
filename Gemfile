source "https://rubygems.org"

# Pin to a specific commit on edoxen/main. The gem jumped to 2.0.0
# (commit 7062d15 and later) with a breaking Meeting schema change that
# requires a top-level `meetings:` collection and drops several fields
# we rely on (year, virtual, resolution_refs, city, country_code, ...).
# Until we migrate the meeting YAMLs to the v2 schema, lock to the last
# commit that accepts our current shape (eae1ca2 = edoxen 0.7.2).
gem "edoxen", github: "edoxen/edoxen", ref: "eae1ca2"
