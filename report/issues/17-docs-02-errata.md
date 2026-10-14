---
type: Issue
status: draft
filing: fileable
repo: solidjs/solid
target: solidjs/solid
head: e3716454129f8438b65257c95db5c383622494ba
title: "[2.0 rc.15 + next] Documented pinned derivation does not retake its source after a same-tick unpin"
findings: ['013']
repro_commit: f929e4fcc4f08a89c2f236e236fdfc6520cb123d
---

### Describe the bug

```tsx
// Inside a component or createRoot:
const [source, setSource] = createSignal(1);
const [card, setCard] = createSignal<{ n: number; pinned: boolean }>(
  prev => prev?.pinned ? prev : { n: source(), pinned: false }
);
setCard({ n: 99, pinned: true }); setSource(2); flush();
setCard({ n: 99, pinned: false }); setSource(3); flush();
// card().n remains 99, rather than 3.
```

### Your Example Website or App

[Pinned failing test](https://github.com/celados/solid-conformance/blob/f929e4fcc4f08a89c2f236e236fdfc6520cb123d/findings/013-pinned-source-retake/repro.test.ts).

### Steps to Reproduce the Bug or Issue

Run the linked complete root-owned example. Pin locally, then clear the pin and change source together.
Run `TARGET=rc15 bun test ./findings/013-pinned-source-retake/repro.test.ts` after restoring the published graph; omit TARGET after linking HEAD.

### Expected behavior

The documentation promises source takeover at 3; the documented derivation keeps 99.

### Platform

Solid rc.15 and next `e3716454129f`; development/public types as applicable; Bun 1.4.2, system Chrome.

### Additional context

This is a plausible unsaved/pinned local-state recipe. Read the source unconditionally before selecting the pinned result. The artificial additive-draft hold case 046 is excluded from this draft.
Current [documentation](https://github.com/solidjs/solid/blob/e3716454129f8438b65257c95db5c383622494ba/documentation/solid-2.0/02-signals-derived-ownership.md#L132).
