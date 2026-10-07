# Wave 1 work order — bootstrap the harness and the first two tracks

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

### Track `known-bugs` (validates the harness)
Reproduce our five closed upstream issues (#3764, #3734, #3687, #3338, #3762) on the
version before their fix if feasible, or as regression tests that must pass on rc.13.
Then write **sibling variants** of each bug class (same mechanism, different
primitive or nesting: e.g. #3764 with createStore / createOptimistic / router
liveQuery; #3734 with For/Show/Errored holes; #3687 with nested actions; #3338 with
other lazy/Loading placements). Siblings that fail on rc.13 are findings.

### Track `differential` (first fuzzer)
A generator of small random component trees over: Show, For (keyed and not), Switch/
Match, Loading, Errored, createMemo with async (promise and async iterable), createStore,
createOptimistic/createOptimisticStore, action, createSignal writes in effects, lazy().
Oracles (no expected value needed):
- CSR final DOM == SSR→hydrate final DOM, and no hydration mismatch/warning/error;
- final DOM is independent of async settle order;
- wrapping any subtree in an extra `<Loading>` or `<Show when={true}>` does not change
  the final DOM;
- every async iterable opened is closed after unmount; settle within a bounded number
  of ticks (no infinite loops / non-convergence).
Include a shrinker that minimizes a failing tree. Run it long enough to see whether it
finds anything; record findings.

## Non-goals
- Do not file or comment upstream.
- No spec-to-test track yet (next wave), but note doc claims you notice.

## Proof
`README.md` documents the commands. The known-bugs track runs green except findings;
each finding's repro fails with one command. Record everything in `LEDGER.md`.

## Receipt (final message)
Status, commands, number of trees fuzzed, findings (id, status, one line each),
harness limitations, and what you recommend for wave 2.
