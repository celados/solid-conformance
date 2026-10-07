---
type: Issue
title: Solid 2 documentation errata — MIGRATION.md
status: draft
tier: B
findings: ["047"]
head: dafad1db34626feb5f154e98e599f65be1802c6c
---

# Solid 2 documentation errata: MIGRATION.md

The following published contracts disagree with the public API. Each item identifies the side we think needs correction.

## 047 — A derived store is a proxy, not an accessor

**Quote:** “draft.total = items().length;” ([MIGRATION.md:466](https://github.com/solidjs/solid/blob/dafad1db34626feb5f154e98e599f65be1802c6c/documentation/solid-2.0/MIGRATION.md#L466)).

**Observed:** The example fails public types with TS2349 and runtime with “items is not a function”. items.length yields total 2.

**Proposed correction:** Documentation example is wrong: replace items().length with items.length; callable store semantics are unnecessary.

**Versions/builds:** dafad1db34626feb5f154e98e599f65be1802c6c, public types; development and production runtime; rc.13 also contradicts the same contract. HEAD-only regression: no.

**Local validation (review only):** [minimal failing test and related issues](../../findings/047-derived-store-accessor-example/README.md).

**Related upstream:** No matching issue identified in the recorded open/closed searches.
