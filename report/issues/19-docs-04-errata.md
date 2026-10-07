---
type: "Issue"
title: "[2.0 rc.13 + next] Solid 2 documentation errata — 04-stores.md"
status: "draft"
tier: "B"
findings: ["006"]
code_cases: ["006"]
head: "3086f1b77cd7b0431d3a7f768c2984c335758633"
repro_commit: "b739f93a27c1d72c5269e15a7ada7543af9e5dbe"
---

# [2.0 rc.13 + next] Solid 2 documentation errata — 04-stores.md

### Your Example Website or App

Executable examples: [006](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/findings/006-storepath-export).

The documented usage differs from the public API below. Suggested corrections identify whether the documentation or implementation should change.

```ts
import { storePath } from "solid-js";

// Build for the browser: the import has no matching export.
```

Build the snippet for the browser.

## 006 — storePath is missing from browser core

**Quote:** “`storePath(...)` is provided as an **opt-in helper**” ([04-stores.md:45](https://github.com/solidjs/solid/blob/3086f1b77cd7b0431d3a7f768c2984c335758633/documentation/solid-2.0/04-stores.md#L45)).

**Expected:** The documented helper is available from the browser-facing public API.
**Actual:** Importing storePath from solid-js fails to bundle against the browser entry. The implementation exists in signals and server core, but not browser core/public types.

**Proposed correction:** The browser export and public declarations likely need fixing if this is the intended Solid API. Otherwise document a supported alternative import explicitly; this report does not invent one.

**Builds/comparison:** 3086f1b77cd7b0431d3a7f768c2984c335758633, development and production browser exports; rc.13 also contradicts the same contract. No HEAD-only regression.

**Related upstream:** [#3092](https://github.com/solidjs/solid/issues/3092)

### Platform

- Solid: `solid-js` / `@solidjs/web` next at `3086f1b77cd7b0431d3a7f768c2984c335758633`; comparison `2.0.0-rc.13`. Signals, compiler and diagnostics match the selected Solid build.
- OS: macOS 26.6.2 (25G83); browser cases: system Google Chrome 155.0.8059.40. Server-only/type checks run in Bun 1.4.2.
- Builds and rc.13 comparisons are listed per item above. The instrumented production export (observe) is used only where specified.

<details>
<summary>Automated reproduction and related-case evidence</summary>

- 006: [minimal failing test and related issues](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/findings/006-storepath-export/README.md).

The linked test directories contain the complete executable checks, setup, and recorded upstream searches.

</details>
