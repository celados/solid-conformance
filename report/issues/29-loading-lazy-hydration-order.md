---
type: Issue
status: draft
filing: fileable
repo: solidjs/solid
target: solidjs/solid
head: e3716454129f8438b65257c95db5c383622494ba
title: '[2.0 rc.15 + next] Hydration reverses static and lazy children in Loading after a sibling'
findings: ['057']
repro_commit: a2b739680e8b616e1973884e8f1d78eca5b6704e
---

### Describe the bug

```tsx
import { lazy, Loading } from "solid-js";
const Lazy = lazy(() => import("./part"));
export function App() {
  return <><span>A</span><Loading fallback="pending"><span>B</span><Lazy /></Loading></>;
}
// part's default component returns <span>C</span>.
```

### Your Example Website or App

[Pinned complete streaming SSR/Chrome reproduction](https://github.com/celados/solid-conformance/tree/a2b739680e8b616e1973884e8f1d78eca5b6704e/findings/057-loading-lazy-hydration-order).

### Steps to Reproduce the Bug or Issue

Render the app to a stream with the lazy module mapped in the asset manifest, then hydrate it with the matching renderId. Let the module settle.
Run `TARGET=rc15 bun test ./findings/057-loading-lazy-hydration-order/repro.test.ts` after restoring the published graph; omit TARGET after linking HEAD.

### Expected behavior

The span order stays A/B/C, matching CSR and the source. Hydration instead produces A/C/B. The console and pageerror channel remain quiet.

### Platform

Solid rc.15 / next `e3716454129f`; development and production; Bun 1.4.2, system Chrome. rc.13 also fails, so no rc.15 regression is claimed.

### Additional context

Removing the preceding A makes B/C hydrate correctly. No Show, action, timer, router, type bypass or hand-written SSR hole is needed. The fixture supplies the module URL metadata normally injected by a bundler and uses HydrationScript with a NoHydration document shell. Found by generated rendering-order/hydration invariants; the pinned test retains a CSR control and quiet-channel checks.
