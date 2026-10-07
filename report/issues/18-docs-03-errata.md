---
type: Issue
title: Solid 2 documentation errata — 03-control-flow.md
status: draft
tier: B
findings: ["030", "041"]
head: dafad1db34626feb5f154e98e599f65be1802c6c
---

# Solid 2 documentation errata: 03-control-flow.md

The following published contracts disagree with the public API. Each item identifies the side we think needs correction.

## 030 — Effect error arm is not a third callback

**Quote:** “`createEffect(compute, effect, onError)`” ([03-control-flow.md:169](https://github.com/solidjs/solid/blob/dafad1db34626feb5f154e98e599f65be1802c6c/documentation/solid-2.0/03-control-flow.md#L169)).

**Observed:** The public third argument is EffectOptions; a callback there fails TypeScript with TS2559. The runtime error arm belongs in the second-argument bundle.

**Proposed correction:** Documentation signature is wrong: write `createEffect(compute, { effect, error: onError })`. The surrounding rule that handled errors bypass the client error hook is correct.

**Versions/builds:** dafad1db34626feb5f154e98e599f65be1802c6c, public types; rc.13 also contradicts the same contract. HEAD-only regression: no.

**Evidence:** [minimal failing test and related issues](../../findings/030-effect-error-signature/README.md).

## 041 — Hydration still evaluates the dynamic callback

**Quote:** “the source is not re-run” ([03-control-flow.md:202](https://github.com/solidjs/solid/blob/dafad1db34626feb5f154e98e599f65be1802c6c/documentation/solid-2.0/03-control-flow.md#L202)).

**Observed:** A dynamic source returning Promise.resolve("article") runs once during hydration. Server DOM is adopted correctly, with no hydration warnings or network request in this repro.

**Proposed correction:** Documentation is likely wrong: distinguish dependency-tracking evaluation during hydration from another real source request. Adoption does not guarantee zero callback invocations.

**Versions/builds:** dafad1db34626feb5f154e98e599f65be1802c6c, development and production; rc.13 also contradicts the same contract. HEAD-only regression: no.

**Evidence:** [minimal failing test and related issues](../../findings/041-dynamic-source-tracking/README.md).
