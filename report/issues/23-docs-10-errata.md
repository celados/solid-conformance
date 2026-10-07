---
type: Issue
title: Solid 2 documentation errata — 10-server-functions.md
status: draft
tier: B
findings: ["024"]
head: dafad1db34626feb5f154e98e599f65be1802c6c
---

# Solid 2 documentation errata: 10-server-functions.md

The documented usage differs from the public API below. Suggested corrections identify whether the documentation or implementation should change.

## 024 — A lone typed array is a native-body exception

**Quote:** “values JSON can’t carry faithfully (Dates, Maps, Sets, typed arrays, cycles” ([10-server-functions.md:47](https://github.com/solidjs/solid/blob/dafad1db34626feb5f154e98e599f65be1802c6c/documentation/solid-2.0/10-server-functions.md#L47)).

**Expected:** The lone typed array requires rich-arguments opt-in.
**Actual:** Without enableRichArguments, a lone Uint8Array round-trips with its type and bytes. A nested Uint8Array is rejected with the documented guidance.

**Proposed correction:** Documentation is likely too broad: list lone ArrayBufferView among native HTTP-body arguments, retaining rich-arguments opt-in for nested arrays.

**Versions/builds:** dafad1db34626feb5f154e98e599f65be1802c6c, development and production; rc.13 also contradicts the same contract. No HEAD-only regression.

<details>
<summary>Automated reproduction and related-case evidence</summary>

- 024: [minimal failing test and related issues](../../findings/024-single-typed-array-encoding/README.md).

The linked test directories contain the complete executable checks, setup, and recorded upstream searches.

</details>
