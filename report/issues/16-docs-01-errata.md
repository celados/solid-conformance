---
type: Issue
title: Solid 2 documentation errata — 01-reactivity-batching-effects.md
status: draft
tier: B
findings: ["015"]
head: dafad1db34626feb5f154e98e599f65be1802c6c
---

# Solid 2 documentation errata: 01-reactivity-batching-effects.md

The following published contracts disagree with the public API. Each item identifies the side we think needs correction.

## 015 — untrack does not allow owned-scope writes

**Quote:** “Writes belong in event handlers, `onSettled`, or untracked blocks.” ([01-reactivity-batching-effects.md:20](https://github.com/solidjs/solid/blob/dafad1db34626feb5f154e98e599f65be1802c6c/documentation/solid-2.0/01-reactivity-batching-effects.md#L20)).

**Observed:** A setter inside `createRoot(() => untrack(() => setValue(1)))` still throws REACTIVE_WRITE_IN_OWNED_SCOPE; imperative and onSettled controls work.

**Proposed correction:** Documentation is likely wrong: untrack clears the tracking listener, not ownership. Replace “untracked blocks” with imperative scopes / onSettled, or explicit ownedWrite where appropriate.

**Versions/builds:** dafad1db34626feb5f154e98e599f65be1802c6c, development; production control passes; rc.13 also contradicts the same contract. HEAD-only regression: no.

**Evidence:** [minimal failing test and related issues](../../findings/015-untrack-owned-write/README.md).
