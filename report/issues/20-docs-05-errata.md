---
type: Issue
title: Solid 2 documentation errata — 05-async-data.md
status: draft
tier: B
findings: ["007", "048", "052"]
head: dafad1db34626feb5f154e98e599f65be1802c6c
---

# Solid 2 documentation errata: 05-async-data.md

The following published contracts disagree with the public API. Each item identifies the side we think needs correction.

## 007 — Loading.on does not call a function-valued JSX prop

**Quote:** “A zero-argument function is a tracked accessor, not a callback.” ([05-async-data.md:96](https://github.com/solidjs/solid/blob/dafad1db34626feb5f154e98e599f65be1802c6c/documentation/solid-2.0/05-async-data.md#L96)).

**Observed:** With `on={() => { id(); return 1; }}`, changing id while a replacement request is pending retains prior content. `on={id()}` supplies a reactive dependency instead.

**Proposed correction:** Documentation example is likely wrong for compiled JSX: use a reactive expression and remove the promise that Loading automatically invokes an arbitrary zero-argument function value.

**Versions/builds:** dafad1db34626feb5f154e98e599f65be1802c6c, development and production; rc.13 also contradicts the same contract. HEAD-only regression: no.

**Evidence:** [minimal failing test and related issues](../../findings/007-loading-on-accessor/README.md).

## 048 — A new Loading can read a held committed value

**Quote:** “the boundary shows its fallback now, and the content appears when the change commits.” ([05-async-data.md:50](https://github.com/solidjs/solid/blob/dafad1db34626feb5f154e98e599f65be1802c6c/documentation/solid-2.0/05-async-data.md#L50)).

**Observed:** A newly mounted Loading reads a held plain signal as committed value 0, with isPending true, without showing fallback. It reaches 1 at action commit; an unready async-source control shows fallback.

**Proposed correction:** Documentation should limit the fallback rule to reads that cannot provide a committed answer, rather than all held writes.

**Versions/builds:** dafad1db34626feb5f154e98e599f65be1802c6c, development and production; rc.13 also contradicts the same contract. HEAD-only regression: no.

**Evidence:** [minimal failing test and related issues](../../findings/048-first-loading-held-signal/README.md).

## 052 — transparent also changes SSR slots

**Quote:** “SSR ignores the option (server-side nodes always allocate their id slot)” ([05-async-data.md:227](https://github.com/solidjs/solid/blob/dafad1db34626feb5f154e98e599f65be1802c6c/documentation/solid-2.0/05-async-data.md#L227)).

**Observed:** The same async memo serializes source record 0=42 with transparent false; true omits it and consumes one fewer hydration slot.

**Proposed correction:** Documentation is likely stale: transparent skips its slot on both sides. Document consistent node creation; this repro does not establish a hydration mismatch.

**Versions/builds:** dafad1db34626feb5f154e98e599f65be1802c6c, development and production SSR; rc.13 also contradicts the same contract. HEAD-only regression: no.

**Evidence:** [minimal failing test and related issues](../../findings/052-transparent-ssr-slot/README.md).
