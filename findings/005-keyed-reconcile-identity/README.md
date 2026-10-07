---
type: Issue
id: '005'
status: duplicate
versions: [2.0.0-rc.13, 53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712]
area: store
upstream: [https://github.com/solidjs/solid/issues/2902]
found_by: docs
---

# Reconcile identity wording omits the subscription boundary

Expected from the literal RFC 04 statement: keyed reconcile preserves an unchanged
row's captured proxy. Actual: reversing two never-subscribed rows changes that proxy.

## Run

```sh
bun test ./findings/005-keyed-reconcile-identity/repro.test.ts
```

The test is deliberately red on HEAD and RC13 and uses the production signal engine
directly under Bun. [RFC 04, reconcile](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/04-stores.md#reconcile)
says it preserves identity for unchanged entries without qualifying subscriptions.

## Verdict and dedupe

**The documentation needs qualification; this is not a new runtime bug.**
#2902's resolution explicitly allows captured-but-never-subscribed proxies to
detach. This new shape uses a root array permutation instead of a nested object
replacement. It is recorded as duplicate to retain that design ruling. Related
#2825 involved proxy-valued inputs and stack overflow, a different mechanism.
Open/closed reconcile and reconcile identity searches covered all three repositories.

## Shrinking

Two id-only rows, one captured reference and one keyed permutation. No async,
component, extra fields or DOM is needed. One row cannot express a permutation.
