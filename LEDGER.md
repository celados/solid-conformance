---
type: Reference
title: Discrepancy ledger
description: Minimal desired-behavior tests and upstream deduplication links.
---

# Ledger

| ID | Status | Title | Upstream |
| --- | --- | --- | --- |
| [001](findings/001-streamed-store-keyed/README.md) | duplicate | Streamed createStore + keyed For halts hydration on live takeover | [#3764](https://github.com/solidjs/solid/issues/3764) |
| [002](findings/002-iterable-discovery/README.md) | duplicate | Child setup reading a fresh async iterable never converges in SSR | [#3734](https://github.com/solidjs/solid/issues/3734) |
| [003](findings/003-tsrx-asi/README.md) | duplicate | Native TSRX rejects scalar setup ASI before markup | [#3762](https://github.com/solidjs/solid/issues/3762) |

All entries have a red RC13 test. Duplicate status records a new repro shape, not a new
upstream claim. No upstream write operation was performed. Before recording, searches
included open and closed issues across solidjs/solid, solidjs/solid-router and
solidjs/solid-start using `iterable`, `hydration store`, and `TSRX semicolon`; relevant
related issues include [#3230](https://github.com/solidjs/solid/issues/3230) and
[#3647](https://github.com/solidjs/solid/issues/3647). The starting repository had no ledger.

All three repros pass on built next `53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712`;
see [the verification receipt](evidence/wave1-summary.json). No new unreported issue
was established by this wave.
