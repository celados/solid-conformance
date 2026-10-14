---
type: Issue
status: draft
filing: fileable
repo: solidjs/solid
target: solidjs/solid
head: e3716454129f8438b65257c95db5c383622494ba
title: "[2.0 rc.15 + next] Documented Loading on accessor never rearms the fallback"
findings: ['007']
repro_commit: f929e4fcc4f08a89c2f236e236fdfc6520cb123d
---

### Describe the bug

```tsx
<Loading on={() => { id(); return 1; }} fallback="pending">
  <p>{data()}</p>
</Loading>
```

### Your Example Website or App

[Pinned failing test](https://github.com/celados/solid-conformance/blob/f929e4fcc4f08a89c2f236e236fdfc6520cb123d/findings/007-loading-on-accessor/repro.test.ts).

### Steps to Reproduce the Bug or Issue

Let the first request settle, then change id while the replacement request stays unresolved.
Run `TARGET=rc15 bun test ./findings/007-loading-on-accessor/repro.test.ts` after restoring the published graph; omit TARGET after linking HEAD.

### Expected behavior

The documented zero-argument accessor should rearm Loading. Old content stays instead; on={id()} does rearm it.

### Platform

Solid rc.15 and next `e3716454129f`; development/public types as applicable; Bun 1.4.2, system Chrome.

### Additional context

App loading feedback is affected by the documented prop form. Correct the accessor claim/example or implement its promised unwrapping. Boundary-scope 048 and internal hydration-slot 052 are excluded.
Current [documentation](https://github.com/solidjs/solid/blob/e3716454129f8438b65257c95db5c383622494ba/documentation/solid-2.0/05-async-data.md#L96).
