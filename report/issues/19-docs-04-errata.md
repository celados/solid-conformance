---
type: Issue
status: draft
filing: fileable
repo: solidjs/solid
target: solidjs/solid
head: e3716454129f8438b65257c95db5c383622494ba
title: "[2.0 rc.15 + next] Documented storePath helper is missing from browser solid-js exports"
findings: ['006']
repro_commit: f929e4fcc4f08a89c2f236e236fdfc6520cb123d
---

### Describe the bug

```tsx
import { storePath } from "solid-js";
// Browser build: no matching export for storePath.
```

### Your Example Website or App

[Pinned failing test](https://github.com/celados/solid-conformance/blob/f929e4fcc4f08a89c2f236e236fdfc6520cb123d/findings/006-storepath-export/repro.test.ts).

### Steps to Reproduce the Bug or Issue

Build the documented public import for the browser.
Run `TARGET=rc15 bun test ./findings/006-storepath-export/repro.test.ts` after restoring the published graph; omit TARGET after linking HEAD.

### Expected behavior

The documented opt-in migration helper should be importable. The browser-facing entry and declarations do not export it.

### Platform

Solid rc.15 and next `e3716454129f`; development/public types as applicable; Bun 1.4.2, system Chrome.

### Additional context

An app copying the migration recipe cannot build. Either expose the promised helper and types or document its supported import.
Current [documentation](https://github.com/solidjs/solid/blob/e3716454129f8438b65257c95db5c383622494ba/documentation/solid-2.0/04-stores.md#L45).
