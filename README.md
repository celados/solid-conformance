---
type: Reference
title: Solid 2 conformance — Wave 1
description: >
  Bun-driven client, streaming SSR, Chrome hydration, deterministic async controls,
  regression families and a shrinkable component-tree property generator.
---

# Solid 2 conformance

This standalone suite tests framework behavior; it does not fix or report upstream bugs.
Run with Bun and an installed system Google Chrome. No browser binaries are downloaded.

## Commands

```sh
bun install --frozen-lockfile
bun test                         # harness + regressions + 100 generated trees
bun run regressions
CASES=200 SEED=20261007 bun run properties
bun run check                    # TypeScript
bun run build                    # native compiler, separate DOM/SSR bundles
```

The default suite asserts the exact signatures of known RC13 defects; it does **not**
mark an arbitrary exception as success. The desired-behavior repro tests under
`findings/` are excluded from default discovery and run red independently:

```sh
bun test ./findings/001-streamed-store-keyed/repro.test.ts
bun test ./findings/002-iterable-discovery/repro.test.ts
bun test ./findings/003-tsrx-asi/repro.test.ts
```

Generated failures save the shrunk tree, fast-check seed/path, attempts, browser-run
count and primitive histogram in `artifacts/properties.json`. Replay with
`SEED=<seed> REPLAY_PATH=<counterexamplePath> bun run properties`. Execution logs and
local builds are ignored; checked-in verification receipts are under `evidence/`.

## Version policy

`solid-js`, `@solidjs/web`, `@solidjs/signals`, native compiler and diagnostics are
exactly RC13, installed with `bun add --exact`. The requested Router RC13 does not
exist: `bun add @solidjs/router@2.0.0-rc.13` fails. Router's independently versioned
`next` resolved to **2.0.0-next.35** and is pinned in the lockfile.

Closing an upstream issue is not proof that RC13 includes its fix. [#3734](https://github.com/solidjs/solid/issues/3734),
[#3764](https://github.com/solidjs/solid/issues/3764) and [#3762](https://github.com/solidjs/solid/issues/3762)
were fixed on `next` after RC13. See [LEDGER.md](LEDGER.md) for red repros and HEAD qualification.

## Upstream HEAD

```sh
bun run upstream                  # resolve next to SHA, download tarball, build and link
EXPECT_FIXED=1 bun run regressions
bun test ./findings               # desired-behavior repros should now pass
CASES=200 bun run properties
bun run upstream --restore        # remove links and restore frozen published packages
```

`UPSTREAM_REF=<SHA-or-ref> bun run upstream` selects an immutable revision.
`--build-only` builds without changing the installed runtime; `--link-built` links
that completed build. `.upstream/active.json` identifies the linked SHA.
The build invokes upstream Rollup, TypeScript and NAPI tools through Bun; it
requires the Rust toolchain specified by upstream's Cargo.toml (currently Rust 1.95).
No upstream Git checkout is modified. Router remains the pinned published release.
The script translates workspace setup for Bun and ignores lifecycle scripts that
would invoke npm/pnpm. The runtime and native compiler are built from the same SHA.

## Harness ownership

- `harness/timing.ts`: deferred promises, externally pushed async iterators, closure
  counters, tick stepping and exhaustive permutations (maximum seven inputs).
- `harness/component.tsx`: interpreter for an immutable test-tree AST. DOM and SSR
  compile the **same** TSX through `@solidjs/compiler`, with hydration enabled.
- `harness/server.tsx`: `renderToString`, `renderToStream`, hydration bootstrap and
  lazy asset manifest. Real chunks are piped into Bun's HTTP response.
- `harness/browser.ts`: fresh Chrome page per run, CSR or streamed hydration,
  console warnings/errors, page errors, normalized DOM, iterator teardown and elapsed time.
- `harness/client.tsx`: settle/unmount controls. Native promises are captured before
  Solid's hydration replay can substitute its mock Promise constructor.

Client/server bundles use package export conditions (`browser`/`node`, development).
The HTML host owns the document shell, while Solid owns `#root`. Hydration runs from
an async module after the shell; fragments continue arriving through the open response.
Lazy assets can delay the shell, so a prefix script can release server gates before
client boot. The live-source family deliberately delays the server answer past client
boot. Hydration marker attributes/comments and transport script/template nodes are
removed from DOM comparisons; text, elements and application attributes are retained.

## Tracks and properties

`regressions` contains the five upstream families:

| Issue | Scenario and neighbors |
| --- | --- |
| #3764 | root live memo, createStore, createOptimisticStore, optimistic signal, router liveQuery; keyed For |
| #3734 | compiled function holes, Show, For, Errored; fresh promise vs async iterable, router query/liveQuery |
| #3687 | 16 cases: signal/store × promise/iterable × attribution off/on × nested/plain action |
| #3338 | lazy at root, nested Loading, Errored/Loading; missing asset mapping reaches pageerror |
| #3762 | native DOM/SSR and typecheck projection; function initializer, scalar let, destructuring |

`properties` generates depth-bounded trees (depth ≤ 3, branching ≤ 2) over Show,
non-keyed/keyed For, Switch/Match, Loading, Errored, promise/iterable memo, store,
optimistic signal/store, actions, effect writes and lazy modules. It checks:

1. CSR matches an independent expected-DOM projection and SSR→hydrate; all browser
   warnings/errors/pageerrors and server errors fail the property.
2. Every settle permutation for up to three sources; six deterministic sampled
   orders for larger trees. Each order runs in CSR and hydration.
3. Adding Loading or always-true Show at a sampled **internal or root subtree**
   preserves the final DOM in both modes.
4. Every opened client/server iterable has matching closure counts after disposal.
5. Pending markers disappear within fixed tick budgets; a run exceeding 15 seconds
   closes its page and fails. fast-check shrinks the tree and insertion position.

## Limits and next wave

The grammar models finite, successful data with fixed branch inputs; it does not yet
model arbitrary rejected sources, changing list identity/branch conditions, router
navigation or transport reconnects. Errored is presently an enclosing-boundary case,
not a generator of server-sanitized error values. Settle permutations vary independent
sources, not every possible interleaving of yields and user events. Tick stepping uses
real event-loop turns, not a virtual clock. The generated lazy leaves share one real
module and do not cover Vite's file-route manifest generation. Iterator disposal while still pending and disconnect/backpressure need a dedicated lifecycle property.

Wave 2 should first turn documented state transitions and lifecycle rules into explicit
AST operations (writes, branch/list changes, rejection, refresh, dispose while pending),
then add docs-to-tests with source links. Keep HEAD and RC13 receipts separate and
qualify production builds as well as this development diagnostic path.

## Verification receipt

Primary runs: 200 initial RC13 trees (1,462 browser runs), 100 strengthened RC13
trees (722 browser runs), 20 delivery RC13 trees (140 browser runs), and 100 HEAD
trees (722 browser runs), all using seed 20261007. These are 420 generated-tree
checks across stages/versions, not 420 distinct trees. See the JSON receipts in
[evidence/](evidence/). HEAD revision: `53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712`.

The three desired-behavior repros fail on RC13 and pass on that built HEAD.
The regression suite retains the known RC13 failure signatures. No earlier release
pair was qualified for #3338/#3687; their published-history baseline remains future work.

Doc claim noted for Wave 2: [RFC 05](https://github.com/solidjs/solid/blob/next/documentation/solid-2.0/05-async-data.md)
distinguishes server adoption, hybrid first-yield takeover, client-only holes and
transparent owner slots. Its tracking-run section explicitly describes mocked
Promise/fetch and advises capturing NativePromise outside replay. Root lazy hydration
is supported without Loading ([#3338](https://github.com/solidjs/solid/issues/3338)).
