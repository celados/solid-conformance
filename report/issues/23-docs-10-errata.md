---
type: Issue
title: Solid 2 documentation errata — 10-server-functions.md
status: draft
tier: B
findings: ["024"]
head: dafad1db34626feb5f154e98e599f65be1802c6c
---

# Solid 2 documentation errata: 10-server-functions.md

The following published contracts disagree with the public API. Each item identifies the side we think needs correction.

## 024 — A lone typed array is a native-body exception

**Quote:** “values JSON can’t carry faithfully (Dates, Maps, Sets, typed arrays, cycles” ([10-server-functions.md:47](https://github.com/solidjs/solid/blob/dafad1db34626feb5f154e98e599f65be1802c6c/documentation/solid-2.0/10-server-functions.md#L47)).

**Observed:** Without enableRichArguments, a lone Uint8Array round-trips with its type and bytes. A nested Uint8Array is rejected with the documented guidance.

**Proposed correction:** Documentation is likely too broad: list lone ArrayBufferView among native HTTP-body arguments, retaining rich-arguments opt-in for nested arrays.

**Versions/builds:** dafad1db34626feb5f154e98e599f65be1802c6c, development and production; rc.13 also contradicts the same contract. HEAD-only regression: no.

**Local validation (review only):** [minimal failing test and related issues](../../findings/024-single-typed-array-encoding/README.md).

**Related upstream:** No matching issue identified in the recorded open/closed searches.
