---
type: Issue
title: Solid 2 documentation errata — 06-actions-optimistic.md
status: draft
tier: B
findings: ["018"]
code_cases: ["018"]
head: dafad1db34626feb5f154e98e599f65be1802c6c
---

# Solid 2 documentation errata: 06-actions-optimistic.md

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

**Quote:** “Refreshing a nested store node re-asks the whole family” ([06-actions-optimistic.md:95](https://github.com/solidjs/solid/blob/dafad1db34626feb5f154e98e599f65be1802c6c/documentation/solid-2.0/06-actions-optimistic.md#L95)).

**Expected:** Refreshing the nested derived-store node type-checks.
**Actual:** refresh(store.row) fails public type checking because the nested node lacks the required $REFRESH brand. Runtime controls refresh row and sibling and preserve identity.

**Proposed correction:** Public types are likely wrong: express the implemented refreshable capability of nested derived-store nodes. RFC05 L346 repeats the guarantee; narrowing documentation would hide supported behavior.

**Versions/builds:** dafad1db34626feb5f154e98e599f65be1802c6c, public types; rc.13 also contradicts the same contract. No HEAD-only regression.

<details>
<summary>Automated reproduction and related-case evidence</summary>

- 018: [minimal failing test and related issues](../../findings/018-nested-refresh-types/README.md).

The linked test directories contain the complete executable checks, setup, and recorded upstream searches.

</details>
