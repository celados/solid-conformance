---
type: Issue
status: filed
filed: https://github.com/solidjs/solid/issues/4051
filing: fileable
repo: solidjs/solid
target: solidjs/solid
head: e3716454129f8438b65257c95db5c383622494ba
title: '[2.0 rc.15 + next] Documented Loading on accessor never rearms the fallback'
findings: ['007']
repro_commit: 44683a4dba3bd8d9f87c30e5cecb8b2ad4f94759
---

### Describe the bug

```tsx
<Loading on={() => { id(); return 1; }} fallback="pending">
  <p>{data()}</p>
</Loading>
```

### Your Example Website or App

[Standalone source, one-command setup and README](https://github.com/celados/solid-conformance/tree/44683a4dba3bd8d9f87c30e5cecb8b2ad4f94759/report/repros/20-loading-on-accessor).

### Steps to Reproduce the Bug or Issue

```sh
cd report/repros/20-loading-on-accessor
bun install
bun run repro
```

The test resolves the first request, then changes id while the replacement request remains unresolved. It compares the accessor form with on={id()}. The README also supplies a one-command clean setup and a next-tag switch.

### Expected behavior

The documented accessor rearms Loading and shows pending. Instead it retains 1; the value-form control shows pending. Both error channels are quiet.

### Platform

Solid rc.15 and next e3716454129f; Bun 1.4.2, system Chrome; development and production.

### Additional context

Correct the zero-argument accessor claim/example, or implement the promised unwrapping. [Documentation](https://github.com/solidjs/solid/blob/e3716454129f8438b65257c95db5c383622494ba/documentation/solid-2.0/05-async-data.md#L96).
