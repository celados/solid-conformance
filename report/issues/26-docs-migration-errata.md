---
type: "Issue"
title: "[2.0 rc.13 + next] Solid 2 documentation errata — MIGRATION.md"
status: "draft"
tier: "B"
findings: ["047"]
code_cases: ["047"]
head: "3086f1b77cd7b0431d3a7f768c2984c335758633"
repro_commit: "b739f93a27c1d72c5269e15a7ada7543af9e5dbe"
---

# [2.0 rc.13 + next] Solid 2 documentation errata — MIGRATION.md

### Your Example Website or App

Executable examples: [047](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/findings/047-derived-store-accessor-example).

The documented usage differs from the public API below. Suggested corrections identify whether the documentation or implementation should change.

```ts
import { createRoot, createStore } from "solid-js";

createRoot(() => {
  const [items] = createStore(() => [1, 2], []);
  const [cache] = createStore(
    draft => {
      // Copy the documented accessor-style use.
      draft.total = items().length;
    },
    { total: 0 },
  );

  console.log(cache.total);
  // TS2349, or "items is not a function" when types are bypassed.
});
```

Evaluate the derived store; bypassing the type error still throws at runtime.

## 047 — A derived store is a proxy, not an accessor

**Quote:** “draft.total = items().length;” ([MIGRATION.md:466](https://github.com/solidjs/solid/blob/3086f1b77cd7b0431d3a7f768c2984c335758633/documentation/solid-2.0/MIGRATION.md#L466)).

**Expected:** The documented callable store usage compiles and yields total 2.
**Actual:** The example fails public types with TS2349 and runtime with “items is not a function”. items.length yields total 2.

**Proposed correction:** Documentation example is wrong: replace items().length with items.length; callable store semantics are unnecessary.

**Builds/comparison:** 3086f1b77cd7b0431d3a7f768c2984c335758633, public types; development and production runtime; rc.13 also contradicts the same contract. No HEAD-only regression.

### Platform

- Solid: `solid-js` / `@solidjs/web` next at `3086f1b77cd7b0431d3a7f768c2984c335758633`; comparison `2.0.0-rc.13`. Signals, compiler and diagnostics match the selected Solid build.
- OS: macOS 26.6.2 (25G83); browser cases: system Google Chrome 155.0.8059.40. Server-only/type checks run in Bun 1.4.2.
- Builds and rc.13 comparisons are listed per item above. The instrumented production export (observe) is used only where specified.

<details>
<summary>Automated reproduction and related-case evidence</summary>

- 047: [minimal failing test and related issues](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/findings/047-derived-store-accessor-example/README.md).

The linked test directories contain the complete executable checks, setup, and recorded upstream searches.

</details>
