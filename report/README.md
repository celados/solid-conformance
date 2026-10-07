# Solid 2 upstream report batch — human review draft

**Not filed. No upstream writes.** Tested Solid next: `dafad1db34626feb5f154e98e599f65be1802c6c`; npm comparison baseline: `2.0.0-rc.13`. Router remains npm `2.0.0-next.35`, not router Git HEAD. Refresh reran all 47 confirmed findings; none is newly fixed. Existing fixed-upstream 001–003 and duplicates 005/050 are excluded from proposed issues.

Review **27 proposals** covering **47 findings**: 15 runtime issues (16 A findings), 11 chapter errata (16 B findings), and one diagnostic/tooling issue (15 C findings). Filing order below puts A high, then med, then low; B chapters and C follow. Numbers are proposal IDs, not upstream issue numbers.

| Proposal | Tier | Severity | Title | Findings covered |
| --- | --- | --- | --- | --- |
| [01-store-rejection.md](issues/01-store-rejection.md) | A | high | Replacement derived-store rejection never reaches Errored | 004 |
| [02-production-refresh.md](issues/02-production-refresh.md) | A | high | Production refresh promise never settles | 008 |
| [03-multisite-hydration.md](issues/03-multisite-hydration.md) | A | high | Second mount of a shared server-component factory fails hydration | 011 |
| [04-live-decoder-stream-lifetime.md](issues/04-live-decoder-stream-lifetime.md) | A | high | Open decoded iterators are missed when a response dies | 014, 035 |
| [05-production-store-affects.md](issues/05-production-store-affects.md) | A | high | Production tree shaking removes store affects registration | 016 |
| [06-loading-nonconvergence.md](issues/06-loading-nonconvergence.md) | A | high | Loading on latest remains in fallback after a shared source settles | 029 |
| [07-document-live-abort.md](issues/07-document-live-abort.md) | A | high | Aborted document closes a live-hole channel twice | 049 |
| [08-nested-server-region.md](issues/08-nested-server-region.md) | A | med | Nested server region stays stale after refetch then argument change | 009 |
| [09-refresh-optimistic-authority.md](issues/09-refresh-optimistic-authority.md) | A | med | Awaited refresh returns the caller optimistic override | 022 |
| [10-sync-asset-resolver.md](issues/10-sync-asset-resolver.md) | A | med | Synchronous lazy asset resolver failure aborts SSR | 032 |
| [11-conditional-get-format.md](issues/11-conditional-get-format.md) | A | med | 304 format header overwrites cached GET representation | 036 |
| [12-async-action-live-ack.md](issues/12-async-action-live-ack.md) | A | med | Async-generator action times out on its authoritative live echo | 053 |
| [13-cookie-proto-key.md](issues/13-cookie-proto-key.md) | A | low | Cookie parser loses the valid __proto__ cookie name | 026 |
| [14-mixed-object-insert.md](issues/14-mixed-object-insert.md) | A | low | Unrenderable object beside text throws instead of being skipped | 034 |
| [15-spread-children-hydration.md](issues/15-spread-children-hydration.md) | A | low | Literal spread children allocate hydration IDs in a different order | 044 |
| [16-docs-01-errata.md](issues/16-docs-01-errata.md) | B | per item | Solid 2 documentation errata — 01-reactivity-batching-effects.md | 015 |
| [17-docs-02-errata.md](issues/17-docs-02-errata.md) | B | per item | Solid 2 documentation errata — 02-signals-derived-ownership.md | 013, 046 |
| [18-docs-03-errata.md](issues/18-docs-03-errata.md) | B | per item | Solid 2 documentation errata — 03-control-flow.md | 030, 041 |
| [19-docs-04-errata.md](issues/19-docs-04-errata.md) | B | per item | Solid 2 documentation errata — 04-stores.md | 006 |
| [20-docs-05-errata.md](issues/20-docs-05-errata.md) | B | per item | Solid 2 documentation errata — 05-async-data.md | 007, 048, 052 |
| [21-docs-06-errata.md](issues/21-docs-06-errata.md) | B | per item | Solid 2 documentation errata — 06-actions-optimistic.md | 018 |
| [22-docs-08-errata.md](issues/22-docs-08-errata.md) | B | per item | Solid 2 documentation errata — 08-dev-diagnostics.md | 045 |
| [23-docs-10-errata.md](issues/23-docs-10-errata.md) | B | per item | Solid 2 documentation errata — 10-server-functions.md | 024 |
| [24-docs-11-errata.md](issues/24-docs-11-errata.md) | B | per item | Solid 2 documentation errata — 11-server-components.md | 027, 038 |
| [25-docs-12-errata.md](issues/25-docs-12-errata.md) | B | per item | Solid 2 documentation errata — 12-ssr-http.md | 031 |
| [26-docs-migration-errata.md](issues/26-docs-migration-errata.md) | B | per item | Solid 2 documentation errata — MIGRATION.md | 047 |
| [27-diagnostics-observability.md](issues/27-diagnostics-observability.md) | C | per item | Solid 2 diagnostics and observability contract discrepancies | 010, 012, 017, 019, 020, 021, 023, 025, 028, 033, 039, 040, 042, 051, 054 |

## Review aids

- [TRIAGE.md](TRIAGE.md): impact, severity, HEAD-only flag, exact failing builds and grouping rationale.
- [Independent review resolutions](evidence/review-resolution.md): corrections, supplementary baseline checks and scope decisions.
- [Recheck results](evidence/recheck-results.json): every current build execution, including green controls.
- Runtime drafts lead with readable source, steps, expected/actual and version scope. Full standalone files remain in [repros/](repros/), linked from the final collapsed section. The displayed source is used by the automated tests; client-only App snippets can be pasted into a Solid 2 playground. HTTP/SSR/hydration examples state their additional requirements.
- 014/035 are grouped on a suspected shared classifier; no runtime patch was applied to prove causality. Other A items are intentionally separate.
- Some B/C items likely require documentation corrections; each states the proposed side and actual behavior rather than prescribing a runtime change without a contract.

## Local validation

`bun run scripts/recheck-findings.ts` reruns the original confirmed findings after a HEAD refresh. Assertion failures are expected and are saved for inspection; the script itself finishes after collecting them. `bun run scripts/verify-report-repros.ts` checks each displayed A snippet against the source actually executed, copies the full folder into a fresh host, and runs development/production; `bun run scripts/validate-report.ts` checks the 60-line first view and final collapsed section. See each proposal for the standalone command and correct artifact condition. A passing rc.13 control is not a HEAD repro.

Approval and filing are a later human action. These files are review material, not authorization to submit anything.
