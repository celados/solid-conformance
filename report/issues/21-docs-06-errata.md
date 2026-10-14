---
type: Issue
status: draft
filing: fileable
repo: solidjs/solid
target: solidjs/solid
head: e3716454129f8438b65257c95db5c383622494ba
title: '[2.0 rc.15 + next] Documented nested derived-store refresh is rejected by public types'
findings: ['018']
repro_commit: 44683a4dba3bd8d9f87c30e5cecb8b2ad4f94759
---

### Describe the bug

```tsx
import { createStore, refresh } from "solid-js";
const [store] = createStore(() => ({ row: { n: 1 } }), { row: { n: 0 } });
void refresh(store.row);
```

### Your Example Website or App

[Standalone source, one-command setup and README](https://github.com/celados/solid-conformance/tree/44683a4dba3bd8d9f87c30e5cecb8b2ad4f94759/report/repros/21-nested-refresh-types).

### Steps to Reproduce the Bug or Issue

```sh
cd report/repros/21-nested-refresh-types
bun install
bun run repro
```

The test typechecks refresh(store) as a passing control, then the documented refresh(store.row) call. The README also supplies a one-command clean setup and a next-tag switch.

### Expected behavior

A nested node of a derived store is refreshable as documented. TypeScript rejects it with TS2345: the nested public type lacks [$REFRESH].

### Platform

Solid rc.15 and next e3716454129f; Bun 1.4.2, public TypeScript declarations.

### Additional context

This is a compile failure in a copied app recipe. Either propagate the refreshable type to nested nodes or correct the stated API. [Documentation](https://github.com/solidjs/solid/blob/e3716454129f8438b65257c95db5c383622494ba/documentation/solid-2.0/06-actions-optimistic.md#L95).
