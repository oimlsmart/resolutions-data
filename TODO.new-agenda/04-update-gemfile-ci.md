# 04 — Update Gemfile + CI to use edoxen v2

## Goal
Remove the pin to old edoxen commit (eae1ca2) and use the latest
main branch which carries the v2 schema.

## Changes
1. Update `Gemfile` to `gem "edoxen", github: "edoxen/edoxen", branch: "main"`
2. Run `bundle update edoxen`
3. Update CI workflow to validate BOTH meetings AND resolutions:
   - `bundle exec edoxen validate-meetings 'meetings/*.yaml'`
   - `bundle exec edoxen validate 'resolutions/*.yaml'`
4. Update `scripts/validate_yaml.rb` for v2 field names

## Done criteria
- [ ] `bundle exec edoxen validate-meetings 'meetings/*.yaml'` passes (58/58)
- [ ] `bundle exec edoxen validate 'resolutions/*.yaml'` passes (56/56)
- [ ] CI workflow validates both
