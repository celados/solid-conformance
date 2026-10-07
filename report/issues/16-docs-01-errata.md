---
type: "Issue"
title: "[2.0 rc.13 + next] Solid 2 documentation errata — 01-reactivity-batching-effects.md"
status: "draft"
tier: "B"
findings: ["015"]
code_cases: ["015"]
head: "3086f1b77cd7b0431d3a7f768c2984c335758633"
repro_commit: "b739f93a27c1d72c5269e15a7ada7543af9e5dbe"
---

# [2.0 rc.13 + next] Solid 2 documentation errata — 01-reactivity-batching-effects.md

### Your Example Website or App

Executable examples: [015](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/findings/015-untrack-owned-write).

The documented usage differs from the public API below. Suggested corrections identify whether the documentation or implementation should change.

```ts
import { createRoot, createSignal, untrack } from "solid-js";

createRoot(() => {
  const [, setValue] = createSignal(0);

  // Run the write inside the documented "untracked block".
  untrack(() => setValue(1));
  // Development throws REACTIVE_WRITE_IN_OWNED_SCOPE.
});
```

Run the snippet in development; the setter throws before returning.

## 015 — untrack does not allow owned-scope writes

**Quote:** “Writes belong in event handlers, `onSettled`, or untracked blocks.” ([01-reactivity-batching-effects.md:20](https://github.com/solidjs/solid/blob/3086f1b77cd7b0431d3a7f768c2984c335758633/documentation/solid-2.0/01-reactivity-batching-effects.md#L20)).

The migration note repeats “The write escapes this rule by running in nonreactive contexts (e.g., event handlers, untracked blocks).” ([01-reactivity-batching-effects.md:274](https://github.com/solidjs/solid/blob/3086f1b77cd7b0431d3a7f768c2984c335758633/documentation/solid-2.0/01-reactivity-batching-effects.md#L274)). Both occurrences need the same clarification.

**Expected:** The documented untracked block permits the setter.
**Actual:** A setter inside `createRoot(() => untrack(() => setValue(1)))` still throws REACTIVE_WRITE_IN_OWNED_SCOPE; imperative and onSettled controls work.

**Proposed correction:** Documentation is likely wrong: untrack clears the tracking listener, not ownership. Replace “untracked blocks” with imperative scopes / onSettled, or explicit ownedWrite where appropriate.

**Builds/comparison:** 3086f1b77cd7b0431d3a7f768c2984c335758633, development; production control passes; rc.13 also contradicts the same contract. No HEAD-only regression.

### Platform

- Solid: `solid-js` / `@solidjs/web` next at `3086f1b77cd7b0431d3a7f768c2984c335758633`; comparison `2.0.0-rc.13`. Signals, compiler and diagnostics match the selected Solid build.
- OS: macOS 26.6.2 (25G83); browser cases: system Google Chrome 155.0.8059.40. Server-only/type checks run in Bun 1.4.2.
- Builds and rc.13 comparisons are listed per item above. The instrumented production export (observe) is used only where specified.

<details>
<summary>Automated reproduction and related-case evidence</summary>

- 015: [minimal failing test and related issues](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/findings/015-untrack-owned-write/README.md).

The linked test directories contain the complete executable checks, setup, and recorded upstream searches.

</details>
