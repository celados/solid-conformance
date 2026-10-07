---
type: Issue
title: Solid 2 documentation errata — 08-dev-diagnostics.md
status: draft
tier: B
findings: ["045"]
head: dafad1db34626feb5f154e98e599f65be1802c6c
---

# Solid 2 documentation errata: 08-dev-diagnostics.md

The following published contracts disagree with the public API. Each item identifies the side we think needs correction.

## 045 — Server-write prose includes an optimistic no-op

**Quote:** “The write landed as inert data” ([08-dev-diagnostics.md:635](https://github.com/solidjs/solid/blob/dafad1db34626feb5f154e98e599f65be1802c6c/documentation/solid-2.0/08-dev-diagnostics.md#L635)).

**Observed:** An ordinary server signal setter updates later reads. An optimistic updater never executes and its value remains 0 in both tiers.

**Proposed correction:** Documentation is wrong: restrict inert-data landing to ordinary setters and explicitly state optimistic setters are hard no-ops. RFC11 L171 already states this.

**Versions/builds:** dafad1db34626feb5f154e98e599f65be1802c6c, development and production SSR; rc.13 also contradicts the same contract. HEAD-only regression: no.

**Local validation (review only):** [minimal failing test and related issues](../../findings/045-server-optimistic-write-wording/README.md).

**Related upstream:** No matching issue identified in the recorded open/closed searches.

The inert-data contrast and the “all server builds” warning clause share RFC11 L171; please apply the correction together with [RFC11 erratum 027](24-docs-11-errata.md).
