---
type: Issue
title: Solid 2 documentation errata — 02-signals-derived-ownership.md
status: draft
tier: B
findings: ["013", "046"]
code_cases: ["013"]
head: dafad1db34626feb5f154e98e599f65be1802c6c
---

# Solid 2 documentation errata: 02-signals-derived-ownership.md

The documented usage differs from the public API below. Suggested corrections identify whether the documentation or implementation should change.

## 013 — Pinned signal loses its source dependency

**Quote:** “Clearing it lets the next source change take over, even when both happen in the same update.” ([02-signals-derived-ownership.md:132](https://github.com/solidjs/solid/blob/dafad1db34626feb5f154e98e599f65be1802c6c/documentation/solid-2.0/02-signals-derived-ownership.md#L132)).

**Expected:** Clearing the pin and changing the source together produces 3.
**Actual:** The published `prev => prev?.pinned ? prev : source()` example retains pinned value 99 when the flag is cleared and source changes to 3 in one update.

**Proposed correction:** Documentation example is likely wrong: read source unconditionally before choosing the pinned result so source changes can trigger recomputation.

**Versions/builds:** dafad1db34626feb5f154e98e599f65be1802c6c, development and production; rc.13 also contradicts the same contract. No HEAD-only regression.

**Related upstream:** [#3612](https://github.com/solidjs/solid/issues/3612)

## 046 — Hold invariance is too broad for store draft writes

**Quote:** “a hold changes when the result is shown, not what it is.” ([02-signals-derived-ownership.md:134](https://github.com/solidjs/solid/blob/dafad1db34626feb5f154e98e599f65be1802c6c/documentation/solid-2.0/02-signals-derived-ownership.md#L134)).

**Expected:** Holding the update preserves the final result, 103.
**Actual:** The held derived store finishes at 105; the same store without a hold and a held derived signal finish at 103. The external draft update reads the pending backing value.

**Proposed correction:** Documentation is likely too broad: distinguish pending backing reads in store draft updates from committed reads of writable derived signals. The following paragraph extends the same guarantee to stores.

**Versions/builds:** dafad1db34626feb5f154e98e599f65be1802c6c, development and production; rc.13 also contradicts the same contract. No HEAD-only regression.

**Related upstream:** [#3612](https://github.com/solidjs/solid/issues/3612)

<details>
<summary>Automated reproduction and related-case evidence</summary>

- 013: [minimal failing test and related issues](../../findings/013-pinned-source-retake/README.md).
- 046: [minimal failing test and related issues](../../findings/046-held-derived-store-seed/README.md).

The linked test directories contain the complete executable checks, setup, and recorded upstream searches.

</details>
