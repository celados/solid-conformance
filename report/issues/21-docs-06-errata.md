---
type: "Issue"
title: "[2.0 rc.13 + next] Solid 2 documentation errata — 06-actions-optimistic.md"
status: "draft"
tier: "B"
findings: ["018"]
code_cases: ["018"]
head: "3086f1b77cd7b0431d3a7f768c2984c335758633"
repro_commit: "b739f93a27c1d72c5269e15a7ada7543af9e5dbe"
---

# [2.0 rc.13 + next] Solid 2 documentation errata — 06-actions-optimistic.md

### Your Example Website or App

Executable examples: [018](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/findings/018-nested-refresh-types).

The documented usage differs from the public API below. Suggested corrections identify whether the documentation or implementation should change.

```ts
import { createStore, refresh } from "solid-js";

const [store] = createStore(
  () => ({ row: { n: 1 } }),
  { row: { n: 0 } },
);

// Type-check the documented nested-node refresh.
void refresh(store.row);
// The nested node is missing the required $REFRESH brand.
```

Type-check the snippet against the public declarations.

## 018 — Nested refresh works at runtime but fails types

**Quote:** “Refreshing a nested store node re-asks the whole family” ([06-actions-optimistic.md:95](https://github.com/solidjs/solid/blob/3086f1b77cd7b0431d3a7f768c2984c335758633/documentation/solid-2.0/06-actions-optimistic.md#L95)).

**Expected:** Refreshing the nested derived-store node type-checks.
**Actual:** refresh(store.row) fails public type checking because the nested node lacks the required $REFRESH brand. Runtime controls refresh row and sibling and preserve identity.

**Proposed correction:** Public types are likely wrong: express the implemented refreshable capability of nested derived-store nodes. RFC05 L346 repeats the guarantee; narrowing documentation would hide supported behavior.

**Builds/comparison:** 3086f1b77cd7b0431d3a7f768c2984c335758633, public types; rc.13 also contradicts the same contract. No HEAD-only regression.

### Platform

- Solid: `solid-js` / `@solidjs/web` next at `3086f1b77cd7b0431d3a7f768c2984c335758633`; comparison `2.0.0-rc.13`. Signals, compiler and diagnostics match the selected Solid build.
- OS: macOS 26.6.2 (25G83); browser cases: system Google Chrome 155.0.8059.40. Server-only/type checks run in Bun 1.4.2.
- Builds and rc.13 comparisons are listed per item above. The instrumented production export (observe) is used only where specified.

<details>
<summary>Automated reproduction and related-case evidence</summary>

- 018: [minimal failing test and related issues](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/findings/018-nested-refresh-types/README.md).

The linked test directories contain the complete executable checks, setup, and recorded upstream searches.

</details>
