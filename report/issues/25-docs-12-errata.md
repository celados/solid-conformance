---
type: "Issue"
title: "[2.0 rc.13 + next] Solid 2 documentation errata — 12-ssr-http.md"
status: "draft"
tier: "B"
findings: ["031"]
head: "3086f1b77cd7b0431d3a7f768c2984c335758633"
repro_commit: "b739f93a27c1d72c5269e15a7ada7543af9e5dbe"
---

# [2.0 rc.13 + next] Solid 2 documentation errata — 12-ssr-http.md

### Your Example Website or App

Executable examples: [031](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/findings/031-direct-error-hook-tier).

The documented usage differs from the public API below. Suggested corrections identify whether the documentation or implementation should change.

## 031 — Request-local error hooks see direct calls

**Quote:** “the only tier that sees direct in-process calls” ([12-ssr-http.md:171](https://github.com/solidjs/solid/blob/3086f1b77cd7b0431d3a7f768c2984c335758633/documentation/solid-2.0/12-ssr-http.md#L171)).

**Expected:** The ambient error hook sees direct in-process calls.
**Actual:** A direct server function inside a render reaches its local onError once and the ambient hook zero times; the local fallback renders.

**Proposed correction:** Documentation is stale: direct calls in an existing request scope use its local hook, falling back to ambient policy when no such hook exists. The paragraph’s per-request override rule is correct.

**Builds/comparison:** 3086f1b77cd7b0431d3a7f768c2984c335758633, development and production; rc.13 also contradicts the same contract. No HEAD-only regression.

### Platform

- Solid: `solid-js` / `@solidjs/web` next at `3086f1b77cd7b0431d3a7f768c2984c335758633`; comparison `2.0.0-rc.13`. Signals, compiler and diagnostics match the selected Solid build.
- OS: macOS 26.6.2 (25G83); browser cases: system Google Chrome 155.0.8059.40. Server-only/type checks run in Bun 1.4.2.
- Builds and rc.13 comparisons are listed per item above. The instrumented production export (observe) is used only where specified.

<details>
<summary>Automated reproduction and related-case evidence</summary>

- 031: [minimal failing test and related issues](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/findings/031-direct-error-hook-tier/README.md).

The linked test directories contain the complete executable checks, setup, and recorded upstream searches.

</details>
