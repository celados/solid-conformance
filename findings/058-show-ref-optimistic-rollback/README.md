---
id: '058'
status: confirmed
versions: ['2.0.0-rc.21']
area: optimistic/action
upstream: ['https://github.com/solidjs/solid/issues/4137', 'https://github.com/solidjs/solid/pull/4153', 'https://github.com/solidjs/solid/issues/4341']
found_by: rc21-control-flow-accessors
---

# Show ref reads a stale accessor when an optimistic hide rolls back

Expected: after the action settles, the committed branch returns and its ref can read the branch accessor. Actual: the ref throws a stale Show read during restoration and reactivity halts.

Run: `bun test ./findings/058-show-ref-optimistic-rollback/repro.test.ts` (Bun, network, system Chrome).

The accessor is read by the branch's ref callback when Solid creates the element; it is not saved or invoked by a later timer. Solid's control-flow contract scopes the narrowed accessor to the live branch. This is related to #4137/#4153 and #4341 by symptom; the mechanism has not been established to be the same.

Shrinking: a single Show and a single optimistic signal suffice; no nested boundary, spread, other signal, memo, or application code is required. A plain JSX attribute in place of the ref passes in the same probe. The action hides an initially visible branch, yields, then settles without changing the committed value; the error appears during restoration, not while the hide is pending.
