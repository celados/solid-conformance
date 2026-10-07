# Wave 4a — draft the upstream report batch (no upstream writes)

Independent verification: all 47 confirmed findings fail in the build their ledger row names
(dev / production / observe) on HEAD 53ef0e69. Now prepare the batch for human review. Do not
file anything.

## 1. Refresh first
Rebuild the latest upstream HEAD and rerun every confirmed finding. Mark the ones that now pass
as `fixed-upstream`. Record the new HEAD.

## 2. Triage into three tiers (write `report/TRIAGE.md`)
- **A — runtime defects users can hit**: wrong rendering, lost errors, hydration failures,
  non-convergence, production-only or HEAD-only divergences, protocol/transport bugs.
- **B — documentation vs implementation**: either side may be wrong; say which you believe.
- **C — diagnostics / observability / dev-tooling internals**.
For each finding: tier, one-line user impact, severity (high/med/low), regression? (HEAD-only),
and which build(s).

## 3. Group into issues (write `report/issues/NN-<slug>.md`, one file per proposed issue)
- Tier A: one issue per root cause. Merge findings that share a mechanism (say why you think
  they share it). Each issue: title, summary, minimal repro inline (self-contained code, no
  harness imports, runnable in a fresh Solid 2 project or StackBlitz-style), expected vs actual,
  versions/builds, related upstream issues.
- Tier B: one "documentation errata" issue per docs chapter, listing each item with the quote,
  the observed behavior, and the proposed correction.
- Tier C: a single issue listing all items.
Match the tone of solidjs/solid issues: short, factual, repro-first. English.

## 4. Index
`report/README.md`: the list of proposed issues in filing order (A by severity first), each
with the findings it covers. This is what the human will review and approve.

Receipt: new HEAD, findings now fixed-upstream, count per tier, number of proposed issues.
