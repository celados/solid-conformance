---
type: Issue
id: '001'
status: fixed-upstream
versions: [2.0.0-rc.13]
area: hydration
upstream: [https://github.com/solidjs/solid/issues/3764]
found_by: regressions
---

# Streamed createStore with a keyed For

Expected: hydrate one keyed row and keep reactivity running when the live source takes over.
Actual on RC13: the server row stays visible, but keyed lookup reads undefined and reports REACTIVITY_HALTED/pageerror.

## Run

```sh
bun test ./findings/001-streamed-store-keyed/repro.test.ts
```

## Contract and deduplication

Hydration must claim the existing DOM before live takeover changes its backing data.
This is the same mechanism as [#3764](https://github.com/solidjs/solid/issues/3764),
with a new primitive (`createStore`, rather than `createOptimisticStore`). Runtime is
wrong; retaining correct-looking markup while the scheduler crashes violates the invariant.

## Shrinking

Reduced to one row, one derived memo, one keyed For and one Loading. Removed ul,
Errored, props, extra components and extra rows. The controlled promise/live source
is in shared timing infrastructure. Removing the derived memo removes this specific
undefined-row failure but exposes an unclaimed-node warning (covered by the larger
regression family); removing keyed lookup or live takeover removes the crash.

## HEAD qualification

The desired-behavior repro passes on the built `next` snapshot
`53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712`. The status is fixed-upstream; the issue link retains deduplication provenance.
The named failing release is RC13.

## Wave 5 re-baseline

Published comparator: Solid `2.0.0-rc.15`, Router `2.0.0-next.39`. Development: passes (a zero-test tier is not applicable); production: passes (a zero-test tier is not applicable). Raw results: [rc.15 matrix](../../report/evidence/wave5-rc15-matrix.json). HEAD at `e3716454129f8438b65257c95db5c383622494ba` is independently re-run in the [HEAD matrix](../../report/evidence/wave5-head-matrix.json); use its individual rows rather than assuming every red assertion is a runtime defect.

## Wave 5 filing bar

**excluded-fixed**: Desired-behavior repro passes in the latest tested runtime; historical failing versions retained.

The first HEAD production run hit its 30-second test deadline without a failed DOM assertion. A final isolated rerun passed both expectations in 10.17 seconds; the initial timeout remains in the raw matrix, with the [supplemental pass](../../report/evidence/wave5-001-production-recheck.log) recorded separately.
