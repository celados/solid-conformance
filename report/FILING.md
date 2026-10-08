---
type: Reference
title: Final filing list — Wave 4c
status: draft
head: 3086f1b77cd7b0431d3a7f768c2984c335758633
repro_commit: b739f93a27c1d72c5269e15a7ada7543af9e5dbe
---

# Filing list

Tier A filed 2026-10-07 as solidjs/solid#3887–#3901. On 2026-10-08, #3896, #3899, #3900 and #3901 (drafts 10, 13, 14, 15) were withdrawn and closed upstream. Each draft's frontmatter records its status.

## Filing bar

Report only defects that a real app, written by a person or an agent, could plausibly hit. Do not file a defect that needs a type bypass (`as any`, `@ts-*`), a construct nobody writes in practice, or an integration-author-only failure path. Keep such defects in this repo as findings. Apply this bar to drafts 16–27 before filing them.

| Proposal | Tier | Title |
| --- | --- | --- |
| [01](issues/01-store-rejection.md) | A | [2.0 next, regressed after rc.13] Replacement derived-store rejection never reaches Errored |
| [02](issues/02-production-refresh.md) | A | [2.0 next, regressed after rc.13] Production refresh remains pending after a settled computation (production build) |
| [03](issues/03-multisite-hydration.md) | A | [2.0 rc.13 + next] Second mount of a shared server-component factory fails hydration |
| [04](issues/04-live-decoder-stream-lifetime.md) | A | [2.0 rc.13 + next] Open decoded iterators are missed when a response dies |
| [05](issues/05-production-store-affects.md) | A | [2.0 next, regressed after rc.13] Production tree shaking removes store affects registration (production build) |
| [06](issues/06-loading-nonconvergence.md) | A | [2.0 next, regressed after rc.13] Loading on latest remains in fallback after a shared source settles |
| [07](issues/07-document-live-abort.md) | A | [2.0 rc.13 + next] Aborted document closes a live-hole channel twice |
| [08](issues/08-nested-server-region.md) | A | [2.0 rc.13 + next] Nested server region stays stale after refetch then argument change |
| [09](issues/09-refresh-optimistic-authority.md) | A | [2.0 next, regressed after rc.13] Awaited refresh returns the caller optimistic override |
| [10](issues/10-sync-asset-resolver.md) | A (withdrawn) | [2.0 rc.13 + next] Synchronous lazy asset resolver failure aborts SSR |
| [11](issues/11-conditional-get-format.md) | A | [2.0 rc.13 + next] 304 format header overwrites cached GET representation |
| [12](issues/12-async-action-live-ack.md) | A | [2.0 next, regressed after rc.13] Async-generator action times out on its authoritative live echo |
| [13](issues/13-cookie-proto-key.md) | A (withdrawn) | [2.0 rc.13 + next] Cookie parser loses the valid __proto__ cookie name |
| [14](issues/14-mixed-object-insert.md) | A (withdrawn) | [2.0 rc.13 + next] Unrenderable object beside text throws instead of being skipped |
| [15](issues/15-spread-children-hydration.md) | A (withdrawn) | [2.0 rc.13 + next] Literal spread children allocate hydration IDs in a different order |
| [16](issues/16-docs-01-errata.md) | B | [2.0 rc.13 + next] Solid 2 documentation errata — 01-reactivity-batching-effects.md |
| [17](issues/17-docs-02-errata.md) | B | [2.0 rc.13 + next] Solid 2 documentation errata — 02-signals-derived-ownership.md |
| [18](issues/18-docs-03-errata.md) | B | [2.0 rc.13 + next] Solid 2 documentation errata — 03-control-flow.md |
| [19](issues/19-docs-04-errata.md) | B | [2.0 rc.13 + next] Solid 2 documentation errata — 04-stores.md |
| [20](issues/20-docs-05-errata.md) | B | [2.0 rc.13 + next] Solid 2 documentation errata — 05-async-data.md |
| [21](issues/21-docs-06-errata.md) | B | [2.0 rc.13 + next] Solid 2 documentation errata — 06-actions-optimistic.md |
| [22](issues/22-docs-08-errata.md) | B | [2.0 rc.13 + next] Solid 2 documentation errata — 08-dev-diagnostics.md |
| [23](issues/23-docs-10-errata.md) | B | [2.0 rc.13 + next] Solid 2 documentation errata — 10-server-functions.md |
| [24](issues/24-docs-11-errata.md) | B | [2.0 rc.13 + next] Solid 2 documentation errata — 11-server-components.md |
| [25](issues/25-docs-12-errata.md) | B | [2.0 rc.13 + next] Solid 2 documentation errata — 12-ssr-http.md |
| [26](issues/26-docs-migration-errata.md) | B | [2.0 rc.13 + next] Solid 2 documentation errata — MIGRATION.md |
| [27](issues/27-diagnostics-observability.md) | C | [2.0 rc.13 + next] Solid 2 diagnostics and observability contract discrepancies |
