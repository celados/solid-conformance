---
type: Issue
status: draft
filing: fileable
repo: solidjs/solid
target: solidjs/solid
head: e3716454129f8438b65257c95db5c383622494ba
title: "[2.0 rc.15 + next] Migration recipe calls a derived-store proxy as an accessor"
findings: ['047']
repro_commit: f929e4fcc4f08a89c2f236e236fdfc6520cb123d
---

### Describe the bug

```tsx
const [items] = createStore(() => [1, 2], []);
const [cache] = createStore(draft => { draft.total = items().length; }, { total: 0 });
```

### Your Example Website or App

[Pinned failing test](https://github.com/celados/solid-conformance/blob/f929e4fcc4f08a89c2f236e236fdfc6520cb123d/findings/047-derived-store-accessor-example/repro.test.ts).

### Steps to Reproduce the Bug or Issue

Type-check the literal migration example. Use the linked type repro; do not bypass its compile error.
Run `TARGET=rc15 bun test ./findings/047-derived-store-accessor-example/repro.test.ts` after restoring the published graph; omit TARGET after linking HEAD.

### Expected behavior

The copied example should compile and derive total 2. items is a proxy, so calling it fails TS2349.

### Platform

Solid rc.15 and next `e3716454129f`; development/public types as applicable; Bun 1.4.2, system Chrome.

### Additional context

An ordinary agent/person copying the migration recipe hits this compile failure. Change items().length to items.length; the runtime type-bypass arm of the historical finding is not proposed for filing.
Current [documentation](https://github.com/solidjs/solid/blob/e3716454129f8438b65257c95db5c383622494ba/documentation/solid-2.0/MIGRATION.md#L466).
