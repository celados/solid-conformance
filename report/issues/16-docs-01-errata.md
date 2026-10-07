---
type: Issue
title: Solid 2 documentation errata — 01-reactivity-batching-effects.md
status: draft
tier: B
findings: ["015"]
code_cases: ["015"]
head: dafad1db34626feb5f154e98e599f65be1802c6c
---

# Solid 2 documentation errata: 01-reactivity-batching-effects.md

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

**Quote:** “Writes belong in event handlers, `onSettled`, or untracked blocks.” ([01-reactivity-batching-effects.md:20](https://github.com/solidjs/solid/blob/dafad1db34626feb5f154e98e599f65be1802c6c/documentation/solid-2.0/01-reactivity-batching-effects.md#L20)).

The migration note repeats “The write escapes this rule by running in nonreactive contexts (e.g., event handlers, untracked blocks).” ([01-reactivity-batching-effects.md:274](https://github.com/solidjs/solid/blob/dafad1db34626feb5f154e98e599f65be1802c6c/documentation/solid-2.0/01-reactivity-batching-effects.md#L274)). Both occurrences need the same clarification.

**Expected:** The documented untracked block permits the setter.
**Actual:** A setter inside `createRoot(() => untrack(() => setValue(1)))` still throws REACTIVE_WRITE_IN_OWNED_SCOPE; imperative and onSettled controls work.

**Proposed correction:** Documentation is likely wrong: untrack clears the tracking listener, not ownership. Replace “untracked blocks” with imperative scopes / onSettled, or explicit ownedWrite where appropriate.

**Versions/builds:** dafad1db34626feb5f154e98e599f65be1802c6c, development; production control passes; rc.13 also contradicts the same contract. No HEAD-only regression.

<details>
<summary>Automated reproduction and related-case evidence</summary>

- 015: [minimal failing test and related issues](../../findings/015-untrack-owned-write/README.md).

The linked test directories contain the complete executable checks, setup, and recorded upstream searches.

</details>
