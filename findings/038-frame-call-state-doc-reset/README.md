---
id: '038'
status: confirmed
versions: ["HEAD 53ef0e69 development", "HEAD 53ef0e69 production", "rc.13 development", "rc.13 production"]
area: server-components/docs/state
upstream: []
found_by: docs
---

# Per-call reset text contradicts consumption-site mount identity

RFC11 L114:4 says state inside a server-component boundary resets for a new story argument while outside state survives. The outside counter survives as promised, but the inside counter also retains its value across argument 1 → 2.

Run: `bun test ./findings/038-frame-call-state-doc-reset/repro.test.ts`.
Production: `BUILD_MODE=production bun test ./findings/038-frame-call-state-doc-reset/repro.test.ts`.

The documentation is wrong, rather than the runtime. The same chapter's later derivation pass (L149) splits content-store identity from mount identity: an argument change delivers a new binding into the existing consumption-site instance. Retaining client state follows that later rule, which should replace the earlier reset prose.

The repro has one server heading proving the new argument rendered, one client counter slot without props or children, and one outside counter as the positive half of the sentence. Three assertions prove initial state, an applied user increment, and retained outside state before the reset oracle fails. There is no same-argument refetch, nested server region, stale slot prop or hydration, so it does not depend on finding009.

Open and closed searches across solidjs/solid, solid-router and solid-start for frame/state/arguments were reviewed. The closest issues are solid#2974 (stale SSR payload after remount) and #3540 (Loading `on` keyed boundary swaps/hold); neither reports this conflicting documentation. Existing finding009 concerns stale nested content and is a different mechanism. The rc.13 comparison is recorded by the subsequent Wave 3 verification paragraph and its raw baseline logs; the old pending note is superseded.

rc.13 开发／生产独立对照仍红，原始结果：evidence/solid-wave3-033035-rc13.log、solid-wave3-036038-rc13.log、solid-wave3-034044-rc13-prod.log。
