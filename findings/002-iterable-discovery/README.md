---
type: Issue
id: '002'
status: duplicate
versions: [2.0.0-rc.13]
area: SSR
upstream: [https://github.com/solidjs/solid/issues/3734]
found_by: regressions
---

# Child with a setup async read

Expected: the single async-generator answer produces one paragraph and discovery finishes.
Actual on RC13: SSR runs 10,001 discovery passes, reports non-convergence and never emits the paragraph.

## Run

```sh
bun test ./findings/002-iterable-discovery/repro.test.ts
```

## Contract and deduplication

[The maintainer's analysis of #3734](https://github.com/solidjs/solid/issues/3734)
identifies missing settled-slot reuse for iterable sources; it also distinguishes
unsupported hand-written ssr holes. This repro uses the actual native JSX compiler,
a direct child of Loading, and no hand-written internal renderer functions. Runtime is wrong:
a finite one-yield source must converge, just as the derived-promise control does.

## Shrinking

Removed router, request scope, outer user promise, timers, div, counters, the For and its input array. The child's setup read must remain: moving the read into
JSX tests a different ownership path. The source is a fresh one-yield async generator,
so no transport or elapsed-time ambiguity is needed.

## HEAD qualification

The desired-behavior repro passes on the built `next` snapshot
`53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712`. The status remains duplicate to
retain deduplication provenance; the named failing release is RC13.
