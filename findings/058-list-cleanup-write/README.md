---
type: Issue
id: '058'
status: confirmed
title: List row disposal inherits an owned computation and rejects lifecycle cleanup writes
description: >
  A shared-state release from the same row cleanup succeeds under Show but halts development
  reactivity when For removes the row, including onSettled returned cleanup.
versions: [2.0.0-rc.15, next-2172a37687e92dd91758476423f08cb4a12bcb0c]
area: reactivity/lifecycle/disposal
upstream: []
found_by: field-history-glaze-237
---

# Expected and actual

A row releasing shared reactive state on unmount should behave identically under Show and For.
In development, For removal throws `REACTIVE_WRITE_IN_OWNED_SCOPE`, reports `REACTIVITY_HALTED`,
leaves both rows mounted, and ignores a later append; the identical Show cleanup succeeds.

The ordinary documented lifecycle form `onSettled(() => () => setCount(n => n + 1))` reproduces
this, as does the low-level library form `onCleanup`. No asynchronous source, router, external
library, store, SSR or hydration is required. Production passes these disposal scenarios because
the write guard is development-only; this report does not claim a production crash.

# Run

After the repo's frozen install:

```sh
TARGET=rc15 bun test ./findings/058-list-cleanup-write/repro.test.ts
TARGET=rc15 BUILD_MODE=production bun test ./findings/058-list-cleanup-write/repro.test.ts
```

The first command keeps desired-behavior assertions red. Build/link a fixed upstream revision
using [RUNNING](../../RUNNING.md), then run the same command without `TARGET=rc15` for HEAD.
The runtime receipt identifies the actual package graph and source revision.

# Evidence

- RC15 development: both For disposal variants fail; both Show controls and ownedWrite control pass.
- Source-built HEAD `2172a37687e92dd91758476423f08cb4a12bcb0c`: same development failures.
- HEAD production: five disposal/control cases pass (the two development guard probes skip).
- A source experiment runs cleanup callbacks in an imperative ownerless boundary, restoring
  the previous context/tracking with `runWithOwner` afterward. All seven browser cases pass,
  including two assertions that ordinary computation writes and a computation nested inside
  cleanup still throw the owned-write error.
- Upstream signals tests, using the same Node/Vitest 4.1.6 command in both source states:
  323 files, 5387 passes, 3 expected failures and 2 skips before and after. The generated
  rules index was refreshed in the temporary snapshot after source line changes.

The source experiment is evidence about the boundary, not an upstream-reviewed fix or a
blanket exemption for disposal writes. See [field receipt](../../report/evidence/field-cleanup.json).

# Why this is a framework bug

The shipped cheatsheet recommends onSettled with a returned cleanup for component lifecycle;
effect phases and their cleanups run without an ambient owner. List bookkeeping is an internal
computation and should not become the caller's lifecycle write context.

Fixed source references:

- [Lifecycle form](https://github.com/solidjs/solid/blob/4937f0a2bfddd45a65738c189075aff577530073/packages/solid/CHEATSHEET.md#onsettled)
- [Disposal callback execution](https://github.com/solidjs/solid/blob/2172a37687e92dd91758476423f08cb4a12bcb0c/packages/signals/src/core/owner.ts)
- [Keyed list disposal](https://github.com/solidjs/solid/blob/2172a37687e92dd91758476423f08cb4a12bcb0c/packages/signals/src/map.ts)

# Dedupe and shrinking

Searched open and closed issues in solidjs/solid, solid-router and solid-start for cleanup/write,
For/REACTIVE_WRITE_IN_OWNED_SCOPE, and teardown. Existing #4089 concerns a cleanup rejoining an
already-landed transaction, and #3601 concerns reentrant double cleanup; this repro has no action,
transaction or reentrant disposal. Conformance 015 tests the unrelated untrack documentation claim.

The production trigger was Glaze deleting a row from its own open menu (celados/glaze#235/#237).
The case here independently reduces it to two rows and a release counter; no Glaze or Delta
code is copied. Show and ownedWrite are controls, not repairs hidden in the failing case.
