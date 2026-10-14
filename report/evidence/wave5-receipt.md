---
type: Report
title: Wave 5 conformance execution receipt
status: complete
solid_release: 2.0.0-rc.15
solid_head: e3716454129f8438b65257c95db5c383622494ba
router_release: 2.0.0-next.39
router_head: 4a1685ec8f1ab045843b2ae590c7afe821f73d90
---

# Wave 5 receipt

The original 52 findings were rerun on rc.15 and built HEAD, in development and production where applicable, with observe-specific supplements. Three new minimal cases bring the ledger to **55 findings: 15 fixed-upstream, 37 confirmed, 3 duplicate**. Twelve of the fixes are newly verified this wave; three were historical fixes. New cases are 055 (confirmed), 056 (duplicate of #3851 with a compiled JSX shape), and 057 (confirmed hydration order). See [summary](wave5-summary.json), [fix provenance](wave5-fix-provenance.json), and [per-finding triage](wave5-triage.json).

The published graph pins all Solid packages to rc.15, Router next.39, and registry Vite plugin latest `3.0.0-next.50`, whose peer range includes rc.15. Solid and Router HEAD were built from read-only source snapshots. Historical comparisons include Solid rc.10/rc.13/rc.14 and Router next.30. Execution uses Bun 1.4.2 and system Chrome; no downloaded browser engine, Delta edits, upstream writes or push.

## Navigation version result

With Router next.30 fixed, 055 passes on Solid rc.10/rc.13 and first fails on **rc.14**, continuing through rc.15 and HEAD. Router next.39 and Router HEAD reproduce on supported runtime combinations. Runtime/compiler rc.13/rc.14 swaps follow the runtime, including the supported Router `solid` export condition: the responsible repository is **solidjs/solid**. The tested hand-rolled held transitions without Router publish delayed feedback correctly; the exact runtime trigger remains unisolated. Unsupported old-Solid/new-Router combinations are not classified as bugs. See [version matrix](wave5-bisect.json), [compiler swap](wave5-compiler-swap.json), and [Router artifact comparison](wave5-solid-artifact.json).

056 remains red across rc.10–HEAD, while the primitive-memo version of upstream #3851's test passes on rc.15. It is recorded as a duplicate with a new compiled repro rather than a repeat draft. The handwritten unscoped `ssr()` hole remains [not a bug](wave5-ssr-scope-disposition.md); no compiled/user-reachable example was established.

## Execution and limits

Each historical wide-suite configuration reached all **93 files**, or 372 file attempts in total. Failed-file counts include timeouts:

| Configuration | Files attempted | Failed files | Timed-out files |
| --- | --- | --- | --- |
| rc.15 development | 93 | 26 | 1 |
| HEAD development | 93 | 22 | 2 |
| rc.15 production | 93 | 19 | 2 |
| HEAD production | 93 | 21 | 2 |

[Wide-suite summary](wave5-suite-summary.json) retains run parameters and links to individual outcomes and logs. Historical failures include removed experimental frame exports, changed async expectations and diagnostic metadata. They are retained as raw failures, not automatically promoted to findings. Full-project typecheck also retains [legacy errors](wave5-full-types.log); the new focused code and report scripts have a clean [selected typecheck](wave5-types.log).

001's initial HEAD production finding run reached its 30-second deadline; a final isolated [supplemental rerun](wave5-001-production-recheck.log) passed both assertions in 10.17 seconds. The original matrix keeps the timeout rather than silently replacing it.

The explicit properties seed `20261007`, requested 200 cases, did not finish: rc.15 development was interrupted by the service after logged attempt 100; the other three runs timed out after 1,200,000 ms with last logged attempt 75 and 536 browser runs each. These are [coverage limits](wave5-properties-budget-summary.json), not new findings. Seed `20261008` generic transitions also timed out; focused held UI and Router transitions finished. Transport was additionally rerun on rc.15 with required seed `20261009`. The initial rc.15 development wide run used a global seed override `20261008`; separate required-seed attempts are retained explicitly.

New held-UI and held-mount generators ran 100 cases each on rc.15 and HEAD in both modes. They cover nested Show/Loading/Errored, latest-driven mounts, pending navigation feedback, reordered optimistic store answers and refresh/until through derivations. Only the exact recorded 055/056 intermediate outcomes are recognized; unknown behavior, channel errors and final convergence still fail. Standalone finding tests retain desired-behavior red assertions. Historical rc.13 held-mount comparisons completed; held-UI comparisons timed out and are not claimed green. The original generic hydration generator supplied 057, whose minimal CSR control passes while hydration produces A/C/B instead of A/B/C in rc.13, rc.15 and HEAD, both modes.

The documentation inventory remains an archival source-pinned sentence corpus. Current filing claims were rechecked against HEAD docs and release/runtime evidence; this is not an exhaustive recatalogue of rc.15 docs. Dedupe searched open and closed issues across Solid, Router and Start, with capped broad results disclosed and relevant family conversations additionally read.

## Filing and delivery

Nine short English drafts are fileable, all targeting `solidjs/solid`, in impact order: **29, 28, 20, 19, 21, 26, 18, 17, 16**. Full titles and held reasons are in [FILING](../FILING.md). Four self-withdrawn reports stay excluded: 026/#3899, 032/#3896 and 034/#3900 remain red; 044/#3901 remains red in development with a passing production control. No repeat drafts were prepared.

Pinned executable repro commits are `f929e4fcc4f08a89c2f236e236fdfc6520cb123d` and `a2b739680e8b616e1973884e8f1d78eca5b6704e`; baseline work is `82a50b2`. The [report validator](wave5-report-validation.json) verifies nine drafts, nine findings and nine local pinned Git objects. Remote link availability awaits orchestrator review and push. Local final evidence/report commits are reported in the final chat receipt rather than embedding a self-referential commit hash here.

All started test servers and browsers are stopped. Nine orphan Chrome roots from interrupted or budget-limited tests were individually inspected, recorded and terminated; [cleanup evidence](wave5-process-cleanup.json) records verification. No name-based kill or computed PID list was used.

Remaining limitations are the unfinished generic generated runs, historical wide-suite/type errors, and the unisolated exact runtime trigger for 055. They do not change the independently reproduced filing candidates. No production deployment, alternate runtime/browser or signed-in Delta workflow is claimed.
