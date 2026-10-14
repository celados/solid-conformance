---
type: Issue
status: draft
filing: fileable
repo: solidjs/solid
target: solidjs/solid
head: e3716454129f8438b65257c95db5c383622494ba
title: "[2.0 rc.15 + next] Documented effect error callback is in the wrong argument"
findings: ['030']
repro_commit: f929e4fcc4f08a89c2f236e236fdfc6520cb123d
---

### Describe the bug

```tsx
import { createEffect } from "solid-js";
createEffect(() => 1, () => {}, () => {});
```

### Your Example Website or App

[Pinned failing test](https://github.com/celados/solid-conformance/blob/f929e4fcc4f08a89c2f236e236fdfc6520cb123d/findings/030-effect-error-signature/repro.test.ts).

### Steps to Reproduce the Bug or Issue

Type-check the documented three-callback signature; no type bypass is needed to reproduce the compile failure.
Run `TARGET=rc15 bun test ./findings/030-effect-error-signature/repro.test.ts` after restoring the published graph; omit TARGET after linking HEAD.

### Expected behavior

The documented signature should compile. The third argument is EffectOptions and the callback produces TS2559.

### Platform

Solid rc.15 and next `e3716454129f`; development/public types as applicable; Bun 1.4.2, system Chrome.

### Additional context

A copied app recipe fails to compile. The error arm belongs in the second-argument { effect, error } bundle. Hydration callback-count case 041 is excluded: its repro does not cause a second real request or incorrect UI.
Current [documentation](https://github.com/solidjs/solid/blob/e3716454129f8438b65257c95db5c383622494ba/documentation/solid-2.0/03-control-flow.md#L169).
