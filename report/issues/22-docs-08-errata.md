---
type: Issue
title: Solid 2 documentation errata — 08-dev-diagnostics.md
status: draft
tier: B
findings: ["045"]
head: dafad1db34626feb5f154e98e599f65be1802c6c
---

# Solid 2 documentation errata: 08-dev-diagnostics.md

The documented usage differs from the public API below. Suggested corrections identify whether the documentation or implementation should change.

## 045 — Server-write prose includes an optimistic no-op

**Quote:** “The write landed as inert data” ([08-dev-diagnostics.md:635](https://github.com/solidjs/solid/blob/dafad1db34626feb5f154e98e599f65be1802c6c/documentation/solid-2.0/08-dev-diagnostics.md#L635)).

**Expected:** The server optimistic write lands as inert data.
**Actual:** An ordinary server signal setter updates later reads. An optimistic updater never executes and its value remains 0 in both tiers.

**Proposed correction:** Documentation is wrong: restrict inert-data landing to ordinary setters and explicitly state optimistic setters are hard no-ops. RFC11 L171 already states this.

**Versions/builds:** dafad1db34626feb5f154e98e599f65be1802c6c, development and production SSR; rc.13 also contradicts the same contract. No HEAD-only regression.

Apply this alongside the companion [server-write warning correction](24-docs-11-errata.md), which addresses the same RFC11 paragraph.

<details>
<summary>Automated reproduction and related-case evidence</summary>

- 045: [minimal failing test and related issues](../../findings/045-server-optimistic-write-wording/README.md).

The linked test directories contain the complete executable checks, setup, and recorded upstream searches.

</details>
