---
type: Issue
title: Solid 2 documentation errata — MIGRATION.md
status: draft
tier: B
findings: ["047"]
code_cases: ["047"]
head: dafad1db34626feb5f154e98e599f65be1802c6c
---

# Solid 2 documentation errata: MIGRATION.md

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

**Quote:** “draft.total = items().length;” ([MIGRATION.md:466](https://github.com/solidjs/solid/blob/dafad1db34626feb5f154e98e599f65be1802c6c/documentation/solid-2.0/MIGRATION.md#L466)).

**Expected:** The documented callable store usage compiles and yields total 2.
**Actual:** The example fails public types with TS2349 and runtime with “items is not a function”. items.length yields total 2.

**Proposed correction:** Documentation example is wrong: replace items().length with items.length; callable store semantics are unnecessary.

**Versions/builds:** dafad1db34626feb5f154e98e599f65be1802c6c, public types; development and production runtime; rc.13 also contradicts the same contract. No HEAD-only regression.

<details>
<summary>Automated reproduction and related-case evidence</summary>

- 047: [minimal failing test and related issues](../../findings/047-derived-store-accessor-example/README.md).

The linked test directories contain the complete executable checks, setup, and recorded upstream searches.

</details>
