---
type: Reference
title: Wave 5 filing list — rc.15 and HEAD
status: draft
head: e3716454129f8438b65257c95db5c383622494ba
router_head: 4a1685ec8f1ab045843b2ae590c7afe821f73d90
repro_commits: [f929e4fcc4f08a89c2f236e236fdfc6520cb123d, a2b739680e8b616e1973884e8f1d78eca5b6704e]
links: pending-orchestrator-push
---

# Filing list

No upstream writes; no push. This list is review material. Reproduction links name a local pinned commit and become remotely available after the orchestrator pushes it. Current comparisons use Solid rc.15 and built Solid/Router HEAD; older reports retain their original version evidence.

## Filing bar

Report only defects that a real app, written by a person or an agent, could plausibly hit. No type bypass, impractical construct, or integration-author-only failure path. A documented snippet failing public TypeScript is a reportable compile defect without bypassing that error to invent a runtime defect. Every finding is evaluated in [per-finding triage](evidence/wave5-triage.json); old chapter drafts are reviewed against current HEAD docs in [the docs filing review](evidence/wave5-docs-filing-review.json).

## Fileable batch, ordered by app impact

All targets below are `solidjs/solid`. Drafts contain the short upstream template, source first, and a pinned executable repro.

| Draft | Disposition | Title | Reason |
| --- | --- | --- | --- |
| [29](issues/29-loading-lazy-hydration-order.md) | fileable | [2.0 rc.15 + next] Hydration reverses static and lazy children in Loading after a sibling | A typed streaming SSR layout changes visible child order, with a passing CSR control and quiet channels. |
| [28](issues/28-held-navigation-feedback.md) | fileable | [2.0 rc.15 + next] Held navigation never publishes delayed pending feedback | An ordinary lazy navigation loses its persistent-shell status indicator; fixed-Router and compiler-swap controls isolate the runtime regression. |
| [20](issues/20-docs-05-errata.md) | fileable | [2.0 rc.15 + next] Documented Loading on accessor never rearms the fallback | Copied app loading-feedback recipe retains old content. Only 007 remains in this draft. |
| [19](issues/19-docs-04-errata.md) | fileable | [2.0 rc.15 + next] Documented storePath helper is missing from browser solid-js exports | Documented app migration import cannot build. |
| [21](issues/21-docs-06-errata.md) | fileable | [2.0 rc.15 + next] Documented nested derived-store refresh is rejected by public types | Typed app cannot issue the documented nested refresh; no runtime cast is proposed. |
| [26](issues/26-docs-migration-errata.md) | fileable | [2.0 rc.15 + next] Migration recipe calls a derived-store proxy as an accessor | Literal documented recipe fails TypeScript; only the compile arm is proposed. |
| [18](issues/18-docs-03-errata.md) | fileable | [2.0 rc.15 + next] Documented effect error callback is in the wrong argument | Copied error-handling recipe fails TypeScript. Only 030 remains in this draft. |
| [17](issues/17-docs-02-errata.md) | fileable | [2.0 rc.15 + next] Documented pinned derivation does not retake its source after a same-tick unpin | Plausible local pinned-state recipe retains stale edits. Only 013 remains in this draft. |
| [16](issues/16-docs-01-errata.md) | fileable | [2.0 rc.15 + next] Documentation suggests untrack permits owned-scope writes | The documented repair still throws in an owned app scope. |

## Held or excluded proposals

| Proposal or case | Disposition | Reason |
| --- | --- | --- |
| 01–09, 11–12 | excluded-fixed | Their 12 original findings pass on rc.15 and HEAD; fix commits are in [fix provenance](evidence/wave5-fix-provenance.json). Do not refile the closed batch. |
| 10 / #3896 / 032 | held | Still red, but withdrawn integration asset-resolver failure path. |
| 13 / #3899 / 026 | held | Still red, but withdrawn low-impact cookie-name edge. |
| 14 / #3900 / 034 | held | Still red, but withdrawn non-renderable object/type-bypass path. |
| 15 / #3901 / 044 | held | Still red in dev, production control passes; withdrawn uncommon literal-spread shape. |
| 17 / 046 | held | Artificial additive draft derivation; no ordinary app failure established. |
| 18 / 041 | held | Hydration tracking invocation count without another real request or incorrect DOM. |
| 20 / 048, 052 | held | Committed plain-signal boundary wording / internal SSR source-slot allocation; not the tearing case. |
| [22](issues/22-docs-08-errata.md) | held | Invalid server-write wording; no valid app failure. |
| [23](issues/23-docs-10-errata.md) | held | Typed-array transport succeeds; overly broad opt-in wording only. |
| [24](issues/24-docs-11-errata.md) | held | Diagnostic warning tier and integration frame identity wording. |
| [25](issues/25-docs-12-errata.md) | held | Integration-only direct invocation hook tier. |
| [27](issues/27-diagnostics-observability.md) | held | Diagnostic/tooling contract bundle without demonstrated ordinary app malfunction; malformed-input arms fail the bar. |
| 056 | held | New compiled JSX repro of existing #3851; recorded as duplicate, no repeated issue draft. |

## Evidence limits

055 first fails in **Solid rc.14**, not rc.15. Router next.30 is held fixed; compiler rc.13/rc.14 swaps follow the runtime. next.39 and Router HEAD reproduce on supported Solid versions; incompatible older-runtime combinations are not failures. Both flat and supported `solid` export artifacts are tested. The tested no-Router transitions work, so the exact runtime site remains unknown.

The wide historical suite has stale/internal frames and diagnostic assertions that still fail independently of this filing batch; raw failures are retained rather than relabeled as framework bugs. Full-suite and generated-track receipts document these limits. The internal hand-written unscoped `ssr()` hole is not a finding: no compiled/user-reachable counterexample was established.

[Execution receipt](evidence/wave5-receipt.md) records all four 93-file attempts and the unfinished seed-20261007 properties runs. The batch is fileable on its independent minimal red tests; there is no all-green suite or exhaustive generated-coverage claim.
