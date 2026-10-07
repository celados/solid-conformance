---
type: "Issue"
title: "[2.0 rc.13 + next] Solid 2 documentation errata — 02-signals-derived-ownership.md"
status: "draft"
tier: "B"
findings: ["013","046"]
code_cases: ["013"]
head: "3086f1b77cd7b0431d3a7f768c2984c335758633"
repro_commit: "b739f93a27c1d72c5269e15a7ada7543af9e5dbe"
---

# [2.0 rc.13 + next] Solid 2 documentation errata — 02-signals-derived-ownership.md

### Your Example Website or App

Executable examples: [013](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/findings/013-pinned-source-retake), [046](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/findings/046-held-derived-store-seed).

The documented usage differs from the public API below. Suggested corrections identify whether the documentation or implementation should change.

## 013 — Pinned signal loses its source dependency

**Quote:** “Clearing it lets the next source change take over, even when both happen in the same update.” ([02-signals-derived-ownership.md:132](https://github.com/solidjs/solid/blob/3086f1b77cd7b0431d3a7f768c2984c335758633/documentation/solid-2.0/02-signals-derived-ownership.md#L132)).

**Expected:** Clearing the pin and changing the source together produces 3.
**Actual:** The published `prev => prev?.pinned ? prev : source()` example retains pinned value 99 when the flag is cleared and source changes to 3 in one update.

**Proposed correction:** Documentation example is likely wrong: read source unconditionally before choosing the pinned result so source changes can trigger recomputation.

**Builds/comparison:** 3086f1b77cd7b0431d3a7f768c2984c335758633, development and production; rc.13 also contradicts the same contract. No HEAD-only regression.

**Related upstream:** [#3612](https://github.com/solidjs/solid/issues/3612)

## 046 — Hold invariance is too broad for store draft writes

**Quote:** “a hold changes when the result is shown, not what it is.” ([02-signals-derived-ownership.md:134](https://github.com/solidjs/solid/blob/3086f1b77cd7b0431d3a7f768c2984c335758633/documentation/solid-2.0/02-signals-derived-ownership.md#L134)).

**Expected:** Holding the update preserves the final result, 103.
**Actual:** The held derived store finishes at 105; the same store without a hold and a held derived signal finish at 103. The external draft update reads the pending backing value.

**Proposed correction:** Documentation is likely too broad: distinguish pending backing reads in store draft updates from committed reads of writable derived signals. The following paragraph extends the same guarantee to stores.

**Builds/comparison:** 3086f1b77cd7b0431d3a7f768c2984c335758633, development and production; rc.13 also contradicts the same contract. No HEAD-only regression.

**Related upstream:** [#3612](https://github.com/solidjs/solid/issues/3612)

### Platform

- Solid: `solid-js` / `@solidjs/web` next at `3086f1b77cd7b0431d3a7f768c2984c335758633`; comparison `2.0.0-rc.13`. Signals, compiler and diagnostics match the selected Solid build.
- OS: macOS 26.6.2 (25G83); browser cases: system Google Chrome 155.0.8059.40. Server-only/type checks run in Bun 1.4.2.
- Builds and rc.13 comparisons are listed per item above. The instrumented production export (observe) is used only where specified.

<details>
<summary>Automated reproduction and related-case evidence</summary>

- 013: [minimal failing test and related issues](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/findings/013-pinned-source-retake/README.md).
- 046: [minimal failing test and related issues](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/findings/046-held-derived-store-seed/README.md).

The linked test directories contain the complete executable checks, setup, and recorded upstream searches.

</details>
