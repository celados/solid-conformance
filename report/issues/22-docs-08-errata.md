---
type: "Issue"
title: "[2.0 rc.13 + next] Solid 2 documentation errata — 08-dev-diagnostics.md"
status: "draft"
tier: "B"
findings: ["045"]
head: "3086f1b77cd7b0431d3a7f768c2984c335758633"
repro_commit: "b739f93a27c1d72c5269e15a7ada7543af9e5dbe"
---

# [2.0 rc.13 + next] Solid 2 documentation errata — 08-dev-diagnostics.md

### Your Example Website or App

Executable examples: [045](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/findings/045-server-optimistic-write-wording).

The documented usage differs from the public API below. Suggested corrections identify whether the documentation or implementation should change.

## 045 — Server-write prose includes an optimistic no-op

**Quote:** “The write landed as inert data” ([08-dev-diagnostics.md:635](https://github.com/solidjs/solid/blob/3086f1b77cd7b0431d3a7f768c2984c335758633/documentation/solid-2.0/08-dev-diagnostics.md#L635)).

**Expected:** The server optimistic write lands as inert data.
**Actual:** An ordinary server signal setter updates later reads. An optimistic updater never executes and its value remains 0 in both tiers.

**Proposed correction:** Documentation is wrong: restrict inert-data landing to ordinary setters and explicitly state optimistic setters are hard no-ops. RFC11 L171 already states this.

**Builds/comparison:** 3086f1b77cd7b0431d3a7f768c2984c335758633, development and production SSR; rc.13 also contradicts the same contract. No HEAD-only regression.

Apply this alongside the companion [server-write warning correction](24-docs-11-errata.md), which addresses the same RFC11 paragraph.

### Platform

- Solid: `solid-js` / `@solidjs/web` next at `3086f1b77cd7b0431d3a7f768c2984c335758633`; comparison `2.0.0-rc.13`. Signals, compiler and diagnostics match the selected Solid build.
- OS: macOS 26.6.2 (25G83); browser cases: system Google Chrome 155.0.8059.40. Server-only/type checks run in Bun 1.4.2.
- Builds and rc.13 comparisons are listed per item above. The instrumented production export (observe) is used only where specified.

<details>
<summary>Automated reproduction and related-case evidence</summary>

- 045: [minimal failing test and related issues](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/findings/045-server-optimistic-write-wording/README.md).

The linked test directories contain the complete executable checks, setup, and recorded upstream searches.

</details>
