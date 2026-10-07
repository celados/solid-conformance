# Wave 4c — final format for filing (no upstream writes)

The repo moved to `/Users/dio/workspace/projects/solid-conformance` and is now public at
https://github.com/celados/solid-conformance (branch `main`). Work there; push to origin when done.

1. **Match the upstream bug template** (solidjs/solid `.github/ISSUE_TEMPLATE/bug_report.yml`).
   Each Tier A proposal body uses these headings in order: `### Describe the bug`,
   `### Your Example Website or App` (a GitHub link to its standalone repro directory on our
   public repo, e.g. https://github.com/celados/solid-conformance/tree/main/report/repros/01-store-rejection,
   pinned to a commit sha once pushed), `### Steps to Reproduce the Bug or Issue` (numbered,
   including the code snippet), `### Expected behavior` (expected vs actual),
   `### Platform` (solid-js / @solidjs/web version or next sha, dev/production build, Chrome
   version, OS), `### Additional context` (related issues, why we think it is a bug).
   Errata (B) and the diagnostics issue (C) keep a list format but use the same Platform and
   link conventions.
2. **Titles carry the version range in brackets**, as in our earlier issues
   (e.g. "[2.0 rc.10–rc.13] …"): use `[2.0 rc.13 + next]` when both fail,
   `[2.0 next, regressed after rc.13]` when only HEAD fails, and add `(production build)` when
   only production fails. State the next sha in Platform.
3. **Each standalone repro directory gets a README.md** with: what it shows, one-command
   setup and run against rc.13 and against next (how to point it at a next build), and the
   expected failing output. Add a short root `README.md` for maintainers explaining the repo
   layout (report/, report/repros/, findings/) and that it is a conformance test suite.
4. Rewrite relative `../repros/` links to absolute GitHub URLs pinned to the pushed commit.
5. Verify every repro still fails on the current next HEAD (refresh first) and record the sha.
   Commit, push to origin/main, and confirm the pinned links resolve (`gh api` on each path).

Receipt: next sha, any proposal whose status changed, and the final filing list (title per
proposal).
