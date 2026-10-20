---
type: Issue
id: '056'
status: confirmed
versions: [rc.10 development, rc.10 production, rc.13 development, rc.13 production, rc.14 development, rc.14 production, rc.15 development, rc.15 production, HEAD e371645 development, HEAD e371645 production]
area: async/Loading/compiled-mount
upstream: [https://github.com/solidjs/solid/issues/4166, https://github.com/solidjs/solid/issues/3851, https://github.com/solidjs/solid/issues/3540]
found_by: Delta rc.15 evaluation / held-mount properties
---

# Latest-mounted Loading tears beside committed state

## Active upstream tracking

Filed [#4166](https://github.com/solidjs/solid/issues/4166) for the uncovered DOM
render-effect path, linked to the closed #3851 and its original fix #3869.
The original primitive test was fixed; this independently reproduced shape remains
red on RC15/current HEAD. The new issue contains the minimal JSX, signals-only pin,
candidate source repair and qualification results. It supersedes the historical
decision to hold a duplicate report; maintainer acceptance of the repair is pending.

## Local source repair qualification

An additional signals-only pin reproduces the exact tear with a child DOM render
effect, instead of reading the value directly in the boundary's return expression.
A small core-only candidate carries verdict-mount provenance through intermediate
content computations. It passes this original compiled case in dev/production on
RC15 and current HEAD, strict 80-case development property runs on both, and both
signals suites. See [version-specific source patches and boundaries](../../report/patches/README.md).
This is a local proposal, not an upstream-accepted repair. The default case stays red.

## 2026-10-20 current-HEAD recheck

The original compiled test remains red on RC15 and current source-built Solid
`2172a37687e92dd91758476423f08cb4a12bcb0c` with matching compiler. The intermediate
state tears; final convergence is not the failing assertion. Evidence was added to
[the existing issue](https://github.com/solidjs/solid/issues/3851#issuecomment-6282379876),
with [HEAD](../../report/evidence/field-056-head.log) and [RC15](../../report/evidence/field-existing-held-rc15.log) receipts.

Expected: the new Loading displays `pending` beside the outer committed 0 until the action releases. Actual: compiled JSX displays 1 inside the newly mounted boundary beside the outer 0, then both display 1 after release.

```sh
bun test ./findings/056-latest-mounted-boundary/repro.test.ts
# Published control: bun run upstream --restore
TARGET=rc15 bun test ./findings/056-latest-mounted-boundary/repro.test.ts
```

## Historical contract, deduplication and disposition

This is the exact semantic family described in #3851, closed as fixed by [11e9fb6](https://github.com/solidjs/solid/commit/11e9fb6537e7f30e057590992b21698a902290d4). Record as **duplicate** with a new repro shape: a native-compiled public Show/Loading in real system Chrome, instead of a manually assembled signals boundary. The upstream `packages/signals/tests/verdict-mount-first-pass-3851.test.ts` models the JSX with primitive memos; that primitive form passes locally in rc.15 while the compiled JSX remains red. #3540 defines the boundary fallback-now/content-at-commit contract. This is distinct from 048, whose independent plain-signal boundary reads the old committed 0.

[Release/HEAD matrix](../../report/evidence/wave5-bisect.json) records the compiled failure across rc.10–rc.15 and HEAD. Generated static/function/keyed Show children, with and without Errored, retain raw observations in the held-mount property receipts. This is plausible typed app code, but the existing upstream report already names the defect. Hold a repeat draft; human follow-up to the closed issue is outside this work order's no-write scope.

## Shrinking

One signal, one held action, one outer binding, one Show on latest and one new Loading reading the ordinary accessor. No router, async source, props, type bypass, nested error boundary or timers in the program. The test's observation timer only lets the flush complete. Removing the outer binding hides the tearing; releasing the hold removes the intermediate discrepancy.

## Wave 5 filing bar

**held**: Duplicate of #3851 with compiled JSX repro; hold a repeated report.
