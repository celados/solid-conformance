---
type: Issue
id: '003'
status: fixed-upstream
versions: [2.0.0-rc.13]
area: compiler
upstream: [https://github.com/solidjs/solid/issues/3762]
found_by: regressions
---

# Native TSRX scalar setup declaration before markup

Expected: ASI ends `let a = 1` before the line-leading markup, consistently with the native typecheck projection.
Actual on RC13: native transform throws `Unable to load authored TSRX statement at 23..33`.

## Run

```sh
bun test ./findings/003-tsrx-asi/repro.test.ts
```

## Contract and deduplication

This extends [#3762](https://github.com/solidjs/solid/issues/3762) from a const arrow
initializer to a scalar let declaration. Compiler is wrong: runtime compilation and
its own semantic typecheck projection disagree. DOM/SSR parity and the explicit-semicolon
control are checked in the regression track.

## Shrinking

Removed arrow function, application runtime, imports, browser and SSR path. One setup
binding and one use remain. Adding the semicolon makes it pass. The regression family
also retains destructuring and the original function initializer.

## HEAD qualification

The desired-behavior repro passes on the built `next` snapshot
`53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712`. The status is fixed-upstream; the issue link retains deduplication provenance.
The named failing release is RC13.

## Wave 5 re-baseline

Published comparator: Solid `2.0.0-rc.15`, Router `2.0.0-next.39`. Development: passes (a zero-test tier is not applicable); production: passes (a zero-test tier is not applicable). Raw results: [rc.15 matrix](../../report/evidence/wave5-rc15-matrix.json). HEAD at `e3716454129f8438b65257c95db5c383622494ba` is independently re-run in the [HEAD matrix](../../report/evidence/wave5-head-matrix.json); use its individual rows rather than assuming every red assertion is a runtime defect.

## Wave 5 filing bar

**excluded-fixed**: Desired-behavior repro passes in the latest tested runtime; historical failing versions retained.
