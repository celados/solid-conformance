---
type: Reference
title: Solid rc.21 control-flow accessor probe receipt
---

# rc.21 control-flow accessor probe

Bun 1.4.4, Google Chrome 157.0.8103.51, macOS; development browser builds; compiler, solid-js, signals and web pinned to 2.0.0-rc.21 in clean temporary installs. No production, server rendering, hydration, app integration, router, or live network queries were tested.

- `bun test ./findings/058-show-ref-optimistic-rollback/repro.test.ts`: fails as intended, stale Show and REACTIVITY_HALTED at restoration; final root empty.
- `bun test ./findings/059-match-ref-optimistic-rollback/repro.test.ts`: fails as intended, stale Match and REACTIVITY_HALTED at restoration; final root empty.
- `bun run report/probes/rc21-control-flow/run.ts player`: 64 cases, zero errors, final img absent. This does not reproduce the originally reported player error.
- `bun run report/probes/rc21-control-flow/run.ts matrix`: 1,152 cases, 12 instances of the two ref findings (Show or Match, single branch, optimistic hide, either initial delay, three boundaries). No other error signature recorded. The matrix checks console/page errors and error fallback, not every expected intermediate DOM state. Its `after-settle` label is an initial extra delay, not a prior async settle.
- A focused comparison showed that replacing the ref with a reactive title attribute, removing the extra signal, and opening rather than hiding the initial branch avoids the stale error in the tested cases. A synchronous action with no yield did not expose a visible optimistic hide and did not fail. A waiting action is necessary to reproduce the reported shape as tested; no claim is made that it is necessary in all possible programs.

Read-only issue searches covered open and closed issues in solidjs/solid and searches in solid-router and solid-start. Relevant closed issues: [#4137](https://github.com/solidjs/solid/issues/4137) (child memo during action, fixed by [#4153](https://github.com/solidjs/solid/pull/4153)), [#4341](https://github.com/solidjs/solid/issues/4341) (Match memo with latest and sibling async work), [#3948](https://github.com/solidjs/solid/issues/3948) (latest in Show condition on first mount), and [#2046](https://github.com/solidjs/solid/issues/2046) (older transition stale read). No exact ref/optimistic restoration match was found. Search cannot establish that no duplicate exists; shared runtime cause is unproven. Nothing was posted upstream.
