---
type: Issue
status: draft
filing: fileable
repo: solidjs/solid
target: solidjs/solid
head: e3716454129f8438b65257c95db5c383622494ba
title: "[2.0 rc.15 + next] Documentation suggests untrack permits owned-scope writes"
findings: ['015']
repro_commit: f929e4fcc4f08a89c2f236e236fdfc6520cb123d
---

### Describe the bug

```tsx
import { createRoot, createSignal, untrack } from "solid-js";
createRoot(() => {
  const [, setN] = createSignal(0);
  untrack(() => setN(1));
});
```

### Your Example Website or App

[Pinned failing test](https://github.com/celados/solid-conformance/blob/f929e4fcc4f08a89c2f236e236fdfc6520cb123d/findings/015-untrack-owned-write/repro.test.ts).

### Steps to Reproduce the Bug or Issue

Run in development. The setter throws REACTIVE_WRITE_IN_OWNED_SCOPE.
Run `TARGET=rc15 bun test ./findings/015-untrack-owned-write/repro.test.ts` after restoring the published graph; omit TARGET after linking HEAD.

### Expected behavior

The documented untracked block permits the write. Instead it still has an owner and throws.

### Platform

Solid rc.15 and next `e3716454129f`; development/public types as applicable; Bun 1.4.2, system Chrome.

### Additional context

App code following the documented remedy cannot clear an owned-write diagnostic. Correct the documentation to recommend an imperative scope, onSettled, or ownedWrite.
Current [documentation](https://github.com/solidjs/solid/blob/e3716454129f8438b65257c95db5c383622494ba/documentation/solid-2.0/01-reactivity-batching-effects.md#L20).
