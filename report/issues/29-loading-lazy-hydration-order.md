---
type: Issue
status: draft
filing: fileable
repo: solidjs/solid
target: solidjs/solid
head: e3716454129f8438b65257c95db5c383622494ba
title: '[2.0 rc.15 + next] Hydration reverses static and lazy children in Loading after a sibling'
findings: ['057']
repro_commit: 44683a4dba3bd8d9f87c30e5cecb8b2ad4f94759
---

### Describe the bug

```tsx
import { lazy, Loading } from "solid-js";
const Lazy = lazy(() => import("./part"));
export function App() {
  return <><span>A</span><Loading fallback="pending"><span>B</span><Lazy /></Loading></>;
}
// part exports a component returning <span>C</span>.
```

### Your Example Website or App

[Standalone source, one-command setup and README](https://github.com/celados/solid-conformance/tree/44683a4dba3bd8d9f87c30e5cecb8b2ad4f94759/report/repros/29-loading-lazy-hydration-order).

### Steps to Reproduce the Bug or Issue

```sh
cd report/repros/29-loading-lazy-hydration-order
bun install
bun run repro
```

The test streams this app, hydrates with the matching renderId, and lets the lazy module settle. It also renders the same source in CSR. The README also supplies a one-command clean setup and a next-tag switch.

### Expected behavior

Span order stays A/B/C. CSR does; hydration produces A/C/B, with no console or page errors.

### Platform

Solid rc.15 and next e3716454129f; Bun 1.4.2, system Chrome; development and production.

### Additional context

Removing the preceding A makes B/C hydrate correctly. The repro uses HydrationScript and a NoHydration document shell; its lazy module identity is mapped to the generated asset in the manifest. rc.13 also fails.
