---
type: Issue
status: draft
filing: fileable
repo: solidjs/solid
target: solidjs/solid
head: e3716454129f8438b65257c95db5c383622494ba
title: "[2.0 rc.15 + next] Documented nested derived-store refresh is rejected by public types"
findings: ['018']
repro_commit: f929e4fcc4f08a89c2f236e236fdfc6520cb123d
---

### Describe the bug

```tsx
import { createStore, refresh } from "solid-js";
const [store] = createStore(() => ({ row: { n: 1 } }), { row: { n: 0 } });
void refresh(store.row);
```

### Your Example Website or App

[Pinned failing test](https://github.com/celados/solid-conformance/blob/f929e4fcc4f08a89c2f236e236fdfc6520cb123d/findings/018-nested-refresh-types/repro.test.ts).

### Steps to Reproduce the Bug or Issue

Type-check the documented nested-node refresh.
Run `TARGET=rc15 bun test ./findings/018-nested-refresh-types/repro.test.ts` after restoring the published graph; omit TARGET after linking HEAD.

### Expected behavior

A nested node of a derived store should be refreshable as documented. Its public type lacks the required refresh brand.

### Platform

Solid rc.15 and next `e3716454129f`; development/public types as applicable; Bun 1.4.2, system Chrome.

### Additional context

Typed app code cannot issue the documented nested refresh. The failure is the type error itself, without casting the value to force a runtime path.
Current [documentation](https://github.com/solidjs/solid/blob/e3716454129f8438b65257c95db5c383622494ba/documentation/solid-2.0/06-actions-optimistic.md#L95).
