# 16 — Deploy to GitHub Pages

## Goal
Auto-deploy `browser/dist/` to GitHub Pages on every push to `main`, with a
YAML validation gate that fails the build on malformed data.

## Inputs
- `~/src/isotc184sc4/resolutions/.github/workflows/deploy-pages.yml` (template)
- All 53 `resolutions/*.yaml` (1,640 resolutions)

## Done

### `scripts/validate_yaml.rb` (new, ~75 lines)
Pure-stdlib Ruby validator. For each `resolutions/*.yaml`:
- Parses cleanly under `YAML.load_file`.
- Top-level is a Hash with `metadata` and `resolutions` keys.
- `metadata` has the required fields (`title`, `dates`, `source`, `venue`, `language`).
- Each resolution has `identifier`, `subject`, `title`, `dates`.

Exits non-zero on any failure. No Gemfile required (the 184sc4 workflow uses
`bundle exec edoxen validate`, but pulling in the Edoxen gem for CI is overkill
when the same checks can run on stdlib).

### `.github/workflows/deploy-pages.yml`
Adapted from 184sc4's workflow:

| Job | Purpose |
|---|---|
| `validate` | Ruby 3.4 + `ruby scripts/validate_yaml.rb` |
| `build`    | Node 22 + `npm ci` + `npm run build` → upload `browser/dist` as Pages artifact |
| `deploy`   | `actions/deploy-pages@v5` (only on `main`; PRs build but don't deploy) |

Permissions: `contents: read`, `pages: write`, `id-token: write`.
Concurrency: one in-flight deployment per ref, no mid-flight cancellation.

### `.github/dependabot.yml`
Weekly npm dependency updates for `browser/`.

## Trigger model
- Push to `main` → validate → build → **deploy**.
- Pull request → validate → build (no deploy).
- `workflow_dispatch` → manual run.

## Local dry-run
```bash
ruby scripts/validate_yaml.rb        # what CI runs in the validate job
cd browser && npm ci && npm run build # what CI runs in the build job
```

Both exit 0 locally on the current tree.

## Outputs
- `scripts/validate_yaml.rb`
- `.github/workflows/deploy-pages.yml`
- `.github/dependabot.yml`

## Expected live URL
Once pushed to `main` on `oimlsmart/resolutions-data`:
`https://oimlsmart.github.io/resolutions-data/`

(The `vite.config.ts` `base: '/resolutions-data/'` already matches this path.)
