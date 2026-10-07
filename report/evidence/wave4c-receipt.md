---
type: Reference
title: Wave 4c filing format and verification receipt
status: verified
head: 3086f1b77cd7b0431d3a7f768c2984c335758633
repro_commit: b739f93a27c1d72c5269e15a7ada7543af9e5dbe
---

# Wave 4c receipt

Refreshed, built and tested Solid next **3086f1b77cd7b0431d3a7f768c2984c335758633**. All 47 confirmed cases retain their recorded behavior; **no proposal status changed** and none became fixed-upstream. No issue, comment or PR was created upstream. The Solid 2 documentation files are unchanged from the preceding snapshot.

## Filing material

All A bodies follow the upstream bug template's six requested headings in order. B/C retain per-item lists, Platform and pinned public example links. The copied upstream [template](wave4c-upstream-bug-template.yml) records the format source. Titles distinguish rc.13 + next from a demonstrated next regression, with production-only labels on 02 and 05. Metadata frontmatter stays local; copy only the Markdown body when filing.

Filing order and every complete title: [FILING.md](../FILING.md). Source links pin the separately committed, verified reproduction files and READMEs at **b739f93a27c1d72c5269e15a7ada7543af9e5dbe**. Each of the 15 standalone directories has a one-command Bun runner for rc.13 and for a matching built next source tree; it installs in an isolated temporary project, runs each test file in a separate host, uses system Chrome, and removes the project. The root README is a short English maintainer introduction; detailed suite instructions are preserved in RUNNING.md.

## Verification

- [Original cases](wave4c-recheck-results.json): 99 isolated calls, 12 passing controls / 91 intended failing tests; 47 distinct confirmed cases still red. No timeout or unrelated setup/compile/import failure substituted for a behavior check. Documented missing exports/type errors are themselves the intended checks.
- [Standalone dual-build checks](wave4c-standalone-results.json): 46 calls, five passing controls / 47 intended failing tests; every A source snippet matches its executed file.
- [rc.13 one-command setup](wave4c-runners-rc13.json): all 15 new runners exercised, 12 passing tests / 14 failing tests. Six next regression proposals pass their rc.13 comparison.
- [next one-command setup](wave4c-runners-next.json): all 15 runners exercised, zero passing tests / 26 intended failing tests in their primary failing builds.
- [Format validation](wave4c-format-validation.json): 27 proposals cover all 47 cases once, upstream heading order and version titles valid, source excerpts match, automated details remain last. The six template headings increase the maximum visible body to 67 lines; source readability is preserved.
- [TypeScript](wave4c-typecheck.log) and git diff whitespace check pass. OS: macOS 26.6.2 (25G83); browser: system Chrome 155.0.8059.40; Bun: 1.4.2.

Public pinned path validation is recorded after pushing in [wave4c-pinned-links.json](wave4c-pinned-links.json), using gh api for each unique linked directory/file path.
