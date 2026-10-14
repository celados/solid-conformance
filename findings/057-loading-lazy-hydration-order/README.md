---
type: Issue
id: '057'
status: confirmed
versions: [rc.13 development, rc.13 production, rc.15 development, rc.15 production, HEAD e371645 development, HEAD e371645 production]
area: hydration/rendering-order/Loading/lazy
upstream: []
found_by: generated tree properties / Wave 5
---

# Hydration changes the rendering order inside Loading after a sibling

Expected: a static sibling followed by a Loading containing static B and lazy C preserves A/B/C in both CSR and hydration. Actual: CSR is A/B/C, but hydration produces A/C/B with no warning or page error.

```sh
bun run upstream --restore
TARGET=rc15 bun test ./findings/057-loading-lazy-hydration-order/repro.test.ts
# HEAD: bun run upstream --link-built
bun test ./findings/057-loading-lazy-hydration-order/repro.test.ts
```

## Invariant and reachability

Hydration must preserve the source's final rendering order. The app uses only typed `lazy`, `Loading`, JSX and a normal module import, without a type bypass, hand-written `ssr()` hole, router or action. This is a plausible layout with a header followed by a panel containing a label and a lazy control. The fixture supplies the lazy module's asset URL through the module export normally injected by a bundler; its matching manifest, HydrationScript, NoHydration shell and renderId establish a valid streaming hydration setup. These are test setup, not an asset-resolver failure path.

[Six-version/build calls](../../report/evidence/wave5-rendering-order-matrix.json) all fail at the order assertion with the CSR control and quiet-channel assertions passing. The failing releases include rc.13, so this is not claimed to be an rc.15 regression.

## Shrinking and deduplication

The property seed `20261008`, replay `50:0:1:1:1:1:1:1:1:2:2:4:3:3:4:6:5`, first produced nested Shows with a lazy leaf. Removed every Show, the outer Loading, the component wrapper, numeric props, the timer/deferred import and all but three spans. Removing the preceding A makes B/C hydrate correctly; without lazy there is no async order change. The ordinary Promise-memo control preserves A/B/C. Retained shrinking evidence: [tree matrix](../../report/evidence/wave5-reorder-simple.json).

Read-only searches for `lazy hydration order`, `Show hydration siblings`, `hydration order`, `sibling order` and `Loading lazy hydrate` checked open/closed issues in solid, solid-router and solid-start: [narrow](../../report/evidence/wave5-reorder-dedupe.json) and [broader](../../report/evidence/wave5-reorder-dedupe-broad.json) evidence. Existing #3338 concerns an unbounded lazy hydration failure with a halted graph; this test has Loading and remains quiet. #3762 is native TSRX semicolon parsing. Neither matches this final DOM ordering violation. The existing ledger has no same-shape finding.

## Wave 5 filing bar

**fileable**: An ordinary typed SSR layout changes visible static/lazy child order during hydration.
