---
type: "Issue"
title: "[2.0 rc.13 + next] Solid 2 documentation errata — 10-server-functions.md"
status: "draft"
tier: "B"
findings: ["024"]
head: "3086f1b77cd7b0431d3a7f768c2984c335758633"
repro_commit: "b739f93a27c1d72c5269e15a7ada7543af9e5dbe"
---

# [2.0 rc.13 + next] Solid 2 documentation errata — 10-server-functions.md

### Your Example Website or App

Executable examples: [024](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/findings/024-single-typed-array-encoding).

The documented usage differs from the public API below. Suggested corrections identify whether the documentation or implementation should change.

## 024 — A lone typed array is a native-body exception

**Quote:** “values JSON can’t carry faithfully (Dates, Maps, Sets, typed arrays, cycles” ([10-server-functions.md:47](https://github.com/solidjs/solid/blob/3086f1b77cd7b0431d3a7f768c2984c335758633/documentation/solid-2.0/10-server-functions.md#L47)).

**Expected:** The lone typed array requires rich-arguments opt-in.
**Actual:** Without enableRichArguments, a lone Uint8Array round-trips with its type and bytes. A nested Uint8Array is rejected with the documented guidance.

**Proposed correction:** Documentation is likely too broad: list lone ArrayBufferView among native HTTP-body arguments, retaining rich-arguments opt-in for nested arrays.

**Builds/comparison:** 3086f1b77cd7b0431d3a7f768c2984c335758633, development and production; rc.13 also contradicts the same contract. No HEAD-only regression.

### Platform

- Solid: `solid-js` / `@solidjs/web` next at `3086f1b77cd7b0431d3a7f768c2984c335758633`; comparison `2.0.0-rc.13`. Signals, compiler and diagnostics match the selected Solid build.
- OS: macOS 26.6.2 (25G83); browser cases: system Google Chrome 155.0.8059.40. Server-only/type checks run in Bun 1.4.2.
- Builds and rc.13 comparisons are listed per item above. The instrumented production export (observe) is used only where specified.

<details>
<summary>Automated reproduction and related-case evidence</summary>

- 024: [minimal failing test and related issues](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/findings/024-single-typed-array-encoding/README.md).

The linked test directories contain the complete executable checks, setup, and recorded upstream searches.

</details>
