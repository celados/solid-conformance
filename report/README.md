---
type: Reference
title: Solid 2 Wave 5 — reviewable upstream batch
status: draft
---

# Solid 2 Wave 5 report

No upstream writes and no push. Tested published Solid `2.0.0-rc.15`, Solid HEAD `e3716454129f8438b65257c95db5c383622494ba`, Router `2.0.0-next.39` and built Router HEAD `4a1685ec8f1ab045843b2ae590c7afe821f73d90`. Registry Vite plugin `latest` is `3.0.0-next.50`; its peer range includes rc.15. The `next` plugin tag is stale at next.35.

The previous 52 findings are independently rerun; 12 previously confirmed runtime defects now pass, in addition to the three historical fixes. The four self-withdrawn reports remain excluded even where their tests stay red. Two Delta shapes and one generated rendering-order finding are added: 055 is confirmed, 056 is a new compiled repro shape of #3851 and is recorded as duplicate; 057 preserves a minimal A/B/C → A/C/B hydration failure. The short English filing batch has **nine** drafts: seven narrowed documentation/public-type defects and two runtime cases for navigation feedback and hydration order.

- [Ordered filing list](FILING.md): fileable and held decisions, version ranges, reasons.
- [Per-finding review](TRIAGE.md): every old/new case evaluated against the real-app bar.
- [rc.15 matrix](evidence/wave5-rc15-matrix.json) and [HEAD matrix](evidence/wave5-head-matrix.json): raw desired-behavior tests, pass/fail/skip and owning Bun PID. Development, production and observe evidence remain separate.
- [Navigation version matrix](evidence/wave5-bisect.json), [supported Router artifact](evidence/wave5-solid-artifact.json), and [compiler swap](evidence/wave5-compiler-swap.json): first failure at rc.14, runtime rather than compiler, Router next.30 unchanged.
- [Read-only dedupe](evidence/wave5-dedupe.json) and [filed-issue closure evidence](evidence/wave5-filed-issues.json): open and closed searches across solid, solid-router and solid-start. Broad search result caps are visible; relevant family issues were additionally read. No search proves the absence of every possible duplicate.
- [New-case matrix](evidence/wave5-new-matrix.json): minimal red cases and new generated UI/mount families on rc.13, rc.15 and HEAD. Historical timeouts are not new latest-runtime findings.
- [Rendering-order matrix](evidence/wave5-rendering-order-matrix.json): minimal 057 in rc.13, rc.15 and HEAD, both builds.
- [Fix provenance](evidence/wave5-fix-provenance.json): tested passes paired with upstream fix commits.
- [Wave 5 receipt](evidence/wave5-receipt.md), [wide-suite summary](evidence/wave5-suite-summary.json), and [properties budgets](evidence/wave5-properties-budget-summary.json): completed files, raw failures, interrupted execution and time limits.
- [Owned process cleanup](evidence/wave5-process-cleanup.json): individually recorded test Chrome processes verified exited after service interruption and test budgets.

Pinned reproduction links refer to local commits `f929e4fcc4f08a89c2f236e236fdfc6520cb123d` and `a2b739680e8b616e1973884e8f1d78eca5b6704e`; local Git objects are validated. Remote availability awaits the orchestrator's push. Historical issue drafts 01–15 are archival reports of the already filed batch, not current proposals.

## Limits

The original documentation inventory remains pinned to its original source SHA; it is an archival sentence-coverage corpus, not a claim that every rc.15 sentence has been exhaustively recatalogued. Current chapter claims used for filing were rechecked against HEAD docs and current release/runtime tests. The wide suite still includes obsolete experimental frame exports, old diagnostic metadata and changed async assertions. Its raw failures are reported separately from the minimal findings; a default-suite failure alone is not a finding.

The tested unscoped hand-written `ssr()` hole is integration misuse under #3734 and is excluded. No compiled application shape was found. Bun/macOS/system Chrome evidence does not cover Node, Firefox, Safari, production deployment or a signed-in Delta user flow.
