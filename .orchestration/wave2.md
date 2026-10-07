# Wave 2 — widen coverage (continue in this session)

Wave 1 verified independently: default suite 8/0, the three recorded cases fail on rc.13.
All three turned out to be duplicates of issues already fixed on upstream HEAD, so:

## 0. Target HEAD first
Make upstream HEAD (the `bun run upstream` build) the primary target for every track from
now on; rc.13 is the comparison baseline. A case that fails on rc.13 but passes on HEAD is
`fixed-upstream`, not a new discrepancy. Refresh the HEAD snapshot at the start of each
wave and record its commit in the receipt.

## 1. Property generator: state transitions (your wave-1 recommendation)
Extend the generated trees with: promise/iterable rejection (before and after a first
value), reconnects, unmount and remount while pending, argument changes while pending,
router navigation between routes that share and don't share sources, actions that fail
mid-transition, and interleavings of user events with async settles. Keep the same
properties; add: errors reach the nearest <Errored> exactly once; no stale value from a
superseded request is ever rendered; optimistic overlays are reverted on failure.

## 2. Docs-to-tests track (`tracks/docs`)
Go chapter by chapter through `documentation/solid-2.0/` on upstream `next`. For every
behavioral statement (what a primitive does, ordering guarantees, SSR/hydration rules,
error/Loading semantics, store and optimistic semantics, action semantics), write a test
that checks it, citing the file and sentence in the test name or a comment. Record in
`tracks/docs/COVERAGE.md` which statements are covered and which you judged untestable.
A statement the runtime contradicts is a discrepancy (say which side you think is wrong).

## 3. Production builds
Run the SSR/hydration properties against production builds of solid-js/@solidjs/web
(not only dev builds), since dev-only checks can mask or cause differences.

## Same rules
AGENTS.md applies (no upstream writes, minimal failing repro per finding, dedupe against
open AND closed upstream issues, bun only, system Chrome only). Commit as you go.

## Receipt
HEAD commit tested, cases run per track, docs statements covered/total, new findings
(id, status, one line, fails on HEAD? on rc.13?), and recommendations for wave 3.
