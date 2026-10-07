---
type: Issue
title: Solid 2 documentation errata — 12-ssr-http.md
status: draft
tier: B
findings: ["031"]
head: dafad1db34626feb5f154e98e599f65be1802c6c
---

# Solid 2 documentation errata: 12-ssr-http.md

The following published contracts disagree with the public API. Each item identifies the side we think needs correction.

## 031 — Request-local error hooks see direct calls

**Quote:** “the only tier that sees direct in-process calls” ([12-ssr-http.md:171](https://github.com/solidjs/solid/blob/dafad1db34626feb5f154e98e599f65be1802c6c/documentation/solid-2.0/12-ssr-http.md#L171)).

**Observed:** A direct server function inside a render reaches its local onError once and the ambient hook zero times; the local fallback renders.

**Proposed correction:** Documentation is stale: direct calls in an existing request scope use its local hook, falling back to ambient policy when no such hook exists. The paragraph’s per-request override rule is correct.

**Versions/builds:** dafad1db34626feb5f154e98e599f65be1802c6c, development and production; rc.13 also contradicts the same contract. HEAD-only regression: no.

**Local validation (review only):** [minimal failing test and related issues](../../findings/031-direct-error-hook-tier/README.md).

**Related upstream:** No matching issue identified in the recorded open/closed searches.
