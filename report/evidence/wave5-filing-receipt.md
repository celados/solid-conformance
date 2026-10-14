---
type: Report
title: Wave 5 final filing preparation
status: complete
repro_commit: 44683a4dba3bd8d9f87c30e5cecb8b2ad4f94759
repo: solidjs/solid
batch: ['29', '28', '20', '21', '30']
---

# Final filing preparation

The orchestrator-selected batch is five issues, in order 29, 28, 20, 21, 30. Drafts 16, 17, 18, 19 and 26 are superseded by the combined documentation/typing errata in 30. The finding statuses and previous Wave 5 matrices are unchanged. [FILING](../FILING.md) contains the five full titles and pinned maintainer links.

All five standalone repro directories are pinned at **44683a4dba3bd8d9f87c30e5cecb8b2ad4f94759**. Each contains its own package manifest, Bun lockfile, test configuration, source, test and maintainer README. None import the repo harness. Maintainers can clone at that commit, enter the linked directory, run `bun install`, then `bun run repro`. Alternatively `bun run run.ts rc15` creates a fresh temporary project, installs the lockfile, executes the same test and removes the project. `bun run run.ts next` installs matching Solid packages from the registry next tag instead of linking a checkout. Router remains pinned to next.39.

## Clean-install verification

Each directory was copied without node_modules or build output into a newly created directory outside the checkout. `bun install --frozen-lockfile` succeeded; real paths of all installed dependencies were verified to remain under that isolated directory, with Solid packages reporting rc.15. Then `bun run repro` failed its desired-behavior assertion, as intended. The one-command setup was independently run for all five and produced the same outcomes.

| Repro | Installation | Test result | Passing controls |
| --- | --- | --- | --- |
| [29](../repros/29-loading-lazy-hydration-order/README.md) | exit 0 | 0 pass / 1 fail; hydrated A/C/B instead of A/B/C | CSR A/B/C; quiet console/pageerror |
| [28](../repros/28-held-navigation-feedback/README.md) | exit 0 | 0 pass / 1 fail; held status count 0 instead of 1 | old page and URL retained; release commits new page and /slow; quiet channels |
| [20](../repros/20-loading-on-accessor/README.md) | exit 0 | 0 pass / 1 fail; accessor retains 1 instead of pending | value-form on displays pending; quiet channels |
| [21](../repros/21-nested-refresh-types/README.md) | exit 0 | 0 pass / 1 fail; nested refresh TS2345 | root-store refresh typechecks |
| [30](../repros/30-documentation-errata/README.md) | exit 0 | 0 pass / 5 fail; owned-write guard, pinned 99 vs 3, TS2559/TS2305/TS2349 | explicit ownedWrite; unconditional source read; corrected effect, draft-setter and proxy-read recipes |

[Direct-command receipts](wave5-filing-repros/summary.json) and [one-command receipts](wave5-filing-repros/one-command/summary.json) retain installation/test PIDs, commands, resolved versions and paths. Their adjacent logs contain the raw assertions. Each temporary project was removed. Test browsers used system Chrome and the servers/browsers closed in finally blocks; no downloaded browser engine or user profile was used.

A final [pinned-commit verification](wave5-filing-repros/pinned/summary.json) read every standalone file from Git commit 44683a4 into five new isolated directories, installed each lockfile and reran `bun run repro`. All five installations exited 0, the tests reproduced the same expected failures above, and all temporary directories were removed. This checks the actual linked Git contents rather than relying on the working tree.

The next-tag entry point was additionally verified with 28: [log](wave5-filing-repros/next/28-held-navigation-feedback-repro.log). All selected Solid next tags still resolve to rc.15, so this is a switch-path verification, not new HEAD evidence. Built HEAD conformance results remain in the previous Wave 5 matrix. The standalone helpers/app source also have successful selected TypeScript checks; intentionally failing documentation fixtures are excluded from those helper checks.

## Draft validation and delivery

[Final validation](wave5-filing-validation.json) checks five fileable drafts covering nine original findings, six upstream-template headings, no more than 50 visible lines each, maintainer commands, supersession metadata and the five pinned standalone directories. Draft 28 retains the fixed-Router rc.13 pass / rc.14 first-failure facts, runtime/compiler-swap result and related #3884 note. Draft 30 has one compact snippet/result/suggested-fix/doc-link section for each erratum.

The original nine-draft proposal, broad-suite failures and generated-run budget limits remain archival evidence. This filing preparation does not claim a green wide suite. No upstream writes or push were performed. Remote repro links await the orchestrator's push; the final report commit is named in the chat receipt rather than embedded here as a self-reference.
