# Wave 1 — set up the test harness and the first two test tracks

Read `AGENTS.md` first; its rules are binding.

## Outcome
A working repo where `bun test`-style commands (your choice of runner, bun-only) can:
1. render a Solid 2 component tree on the client (DOM),
2. render it on the server (`@solidjs/web` SSR, including streaming with `<Loading>`),
3. hydrate the server output in the system Google Chrome and inspect the DOM, console
   (hydration warnings, errors) and timing,
4. drive async timing deterministically: deferred promises and async iterables whose
   resolution order the test chooses, plus helpers to run the same tree under every
   (or many sampled) settle orders.

Pin `solid-js`, `@solidjs/web` and `@solidjs/router` at `2.0.0-rc.13` (`next` tag) via
`bun add`, and make it easy to rerun everything against upstream HEAD (a script that
builds solidjs/solid `next` from a tarball snapshot into `.upstream/` and links it).

## Tracks in this wave

### Track `regressions` (validates the harness)
Turn our five closed upstream issues (#3764, #3734, #3687, #3338, #3762) into
regression tests (failing on the version before the fix if feasible, passing on
rc.13). Then write **neighboring cases** of each scenario (same mechanism, different
primitive or nesting: e.g. #3764 with createStore / createOptimistic / router
liveQuery; #3734 with For/Show/Errored holes; #3687 with nested actions; #3338 with
other lazy/Loading placements). Neighboring cases that fail on rc.13 are recorded.

### Track `properties` (generated property-based tests)
A property-based test generator (fast-check style) of small component trees over: Show, For (keyed and not), Switch/
Match, Loading, Errored, createMemo with async (promise and async iterable), createStore,
createOptimistic/createOptimisticStore, action, createSignal writes in effects, lazy().
Properties checked on every generated tree:
- CSR final DOM == SSR→hydrate final DOM, and no hydration mismatch/warning/error;
- final DOM is independent of async settle order;
- wrapping any subtree in an extra `<Loading>` or `<Show when={true}>` does not change
  the final DOM;
- every async iterable opened is closed after unmount; settle within a bounded number
  of ticks (no infinite loops / non-convergence).
Shrink a failing tree to a minimal one (fast-check shrinking or your own). Run enough
cases to give the properties real coverage; record any failures.

## Non-goals
- Do not file or comment upstream.
- No docs-to-tests track yet (next wave), but note doc claims you notice.

## Proof
`README.md` documents the commands. The regressions track runs green except recorded discrepancies;
each recorded discrepancy's repro fails with one command. Record everything in `LEDGER.md`.

## Receipt (final message)
Status, commands, number of generated cases run, recorded discrepancies (id, status, one line each),
harness limitations, and what you recommend for wave 2.
