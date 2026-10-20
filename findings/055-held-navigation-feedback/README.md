---
type: Issue
id: '055'
status: fixed-upstream
versions: [rc.14 development, rc.14 production, rc.15 development, rc.15 production, HEAD e371645 development, HEAD e371645 production]
area: async/navigation/pending
upstream: [https://github.com/solidjs/solid/issues/4050, https://github.com/solidjs/solid/issues/3884, https://github.com/solidjs/solid-router/issues/655]
found_by: Delta rc.15 evaluation / held-UI properties
---

# Held navigation loses delayed feedback

## Local RC15 backport qualification

The upstream fix is [#4065](https://github.com/solidjs/solid/pull/4065), merged as
`0109a56991976d2d44696a415e2c58cbefe898ca`. Its three signals source changes apply
unchanged to RC15 and turn this original test green in development and production.
See the [source patch, suites and removal gate](../../report/patches/README.md).
The default case remains unpatched; this is not a product dependency upgrade.

## 2026-10-20 current-HEAD recheck

The original desired-behavior test now passes on source-built Solid
`2172a37687e92dd91758476423f08cb4a12bcb0c` with matching compiler and Router next.39;
the identical fresh RC15 run still fails. [#4050](https://github.com/solidjs/solid/issues/4050)
is closed, but its fix is not in RC15. [HEAD receipt](../../report/evidence/field-055-head.log),
[RC15 receipt](../../report/evidence/field-existing-held-rc15.log).
The previous sections describe the historical failing versions, not current HEAD.

Expected: a 300 ms pending indicator appears while lazy route children remain unresolved, beside the old page at the old URL. Actual: routing is true and the timer fires, but the indicator stays absent until the navigation commits, when it is no longer needed.

```sh
bun run upstream --restore
TARGET=rc15 bun test ./findings/055-held-navigation-feedback/repro.test.ts
# HEAD: bun run upstream --link-built; bun run router:upstream --link-built
bun test ./findings/055-held-navigation-feedback/repro.test.ts
```

## Contract and filing bar

Pending navigation feedback is ordinary app UI; the source uses public typed APIs without a type bypass. RFC05 explicitly recommends `isPending()` for visible feedback during a hold. This is a runtime regression in `solidjs/solid`, observed through Router: keeping Router next.30 fixed, rc.13 passes and rc.14 fails. Swapping compiler rc.13/rc.14 confirms the failure follows the runtime rather than the compiler. This identifies the responsible repository and the first failing **release**, not a causal runtime commit.

## Layer matrix and deduplication

[Version matrix](../../report/evidence/wave5-bisect.json) compares Solid rc.10, rc.13, rc.14, rc.15 and HEAD against Router next.30, next.39 and HEAD. [Supported `solid` artifact](../../report/evidence/wave5-solid-artifact.json) confirms the same result when Router JSX is compiled by the selected compiler; [compiler swap](../../report/evidence/wave5-compiler-swap.json) isolates runtime vs compiler. Older Solid / newer Router combinations missing required exports are incompatible, not bug results.

The hand-rolled transition, pending memo, callback-form `isPending`, plain async read and shell-child variants all show delayed feedback without Router. They do not isolate a Router-free minimal runtime trigger. #3884 concerns superseding two navigations and pending state switching; this case has one navigation, correct pending state, and withheld display. #655 is the pending API/bundle-cost refactor. [Read-only open/closed searches in all three repositories](../../report/evidence/wave5-dedupe.json) and the existing ledger found no matching report for this display failure. No upstream writes.

## Shrinking

Removed Delta styles, glow/spinner decoration, labels, wrappers, app providers and fake timers. Kept two routes, one unresolved lazy child Promise, one pending observer, one timer and one Show. The 300 ms threshold is not causal (0–40 ms generated delays also fail); it remains in the standalone repro to express the real-app contract. Replacing the route hold with a hand-rolled transition makes the indicator work; removing the timer avoids this delayed-display shape.

## Wave 5 filing bar

**fileable**: Ordinary delayed navigation indicator is absent under a held route.
