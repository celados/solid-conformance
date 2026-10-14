---
type: Issue
id: "009"
status: fixed-upstream
versions: [upstream-next-53ef0e69]
area: server-components/frames
upstream:
  - https://github.com/solidjs/solid/issues/2965
  - https://github.com/solidjs/solid/issues/2974
  - https://github.com/solidjs/solid/issues/2966
found_by: docs
---

# Nested server regions stay stale after a same-arguments refetch

A server component called with argument `2` should display its nested server slot region containing `2`. After first refetching argument `1`, changing to `2` leaves that region displaying `1` in both development and production on HEAD `53ef0e69`.

```sh
bun test ./findings/009-frame-nested-region-stale/repro.test.ts
```

`documentation/solid-2.0/11-server-components.md`, line 97, states that JSX children ride as nested server regions; line 149 says a changed argument delivers a new binding into the existing instance. Retaining client state is intentional under the derivation contract; retaining server content from the old argument is not. The expected-content assertion fails with `Expected "2", Received "1"`.

## Shrinking

Removed router, hydration, RPC metadata, counter state, event handlers, heading, sibling slots and explicit `$key`. Removing the same-arguments refetch makes the remaining argument change pass. Replacing nested server JSX with plain scalar slot args also passes. The remaining fixture contains a server reference returning one wrapper slot with one nested `span`, and a client `dynamic` with `Loading` that renders the slot in a `section`.

## Dedupe

Searched open and closed issues in `solidjs/solid`, `solidjs/solid-router`, and `solidjs/solid-start` for `server component slot children`, `frame slot argument change`, `nested region stale`, `frame`, and `slot`. Related closed issues above describe duplicate document adoption/cache ownership (#2965), a remount with no mounted sites (#2974), and reactive async slot transport (#2966). This repro uses CSR, has no query cache or unmount, and uses only synchronous server JSX. None describes the remaining refetch→argument-change nested-region failure.

The rc.13 comparison is recorded in the wave receipt after the isolated baseline run.

Wave 4a 独立 rc.13 补验：development 0 pass / 1 fail；production 0 pass / 1 fail。原始日志在 report/evidence/009-rc13-*-supplement.log；报告版本陈述以此为准。

## Wave 5 re-baseline

Published comparator: Solid `2.0.0-rc.15`, Router `2.0.0-next.39`. Development: passes (a zero-test tier is not applicable); production: passes (a zero-test tier is not applicable). Raw results: [rc.15 matrix](../../report/evidence/wave5-rc15-matrix.json). HEAD at `e3716454129f8438b65257c95db5c383622494ba` is independently re-run in the [HEAD matrix](../../report/evidence/wave5-head-matrix.json); use its individual rows rather than assuming every red assertion is a runtime defect.

The original desired-behavior test passes in rc.15. Fix: [5d75ed8](https://github.com/solidjs/solid/commit/5d75ed80bd24b83cf39873484862cacc6368f565), included in the rc.15 release. Original failing versions remain above as historical provenance.

## Wave 5 filing bar

**excluded-fixed**: Desired-behavior repro passes in the latest tested runtime; historical failing versions retained.
