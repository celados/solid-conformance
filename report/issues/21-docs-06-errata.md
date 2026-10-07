---
type: Issue
title: Solid 2 documentation errata — 06-actions-optimistic.md
status: draft
tier: B
findings: ["018"]
head: dafad1db34626feb5f154e98e599f65be1802c6c
---

# Solid 2 documentation errata: 06-actions-optimistic.md

The following published contracts disagree with the public API. Each item identifies the side we think needs correction.

## 018 — Nested refresh works at runtime but fails types

**Quote:** “Refreshing a nested store node re-asks the whole family” ([06-actions-optimistic.md:95](https://github.com/solidjs/solid/blob/dafad1db34626feb5f154e98e599f65be1802c6c/documentation/solid-2.0/06-actions-optimistic.md#L95)).

**Observed:** refresh(store.row) fails public type checking because the nested node lacks the required $REFRESH brand. Runtime controls refresh row and sibling and preserve identity.

**Proposed correction:** Public types are likely wrong: express the implemented refreshable capability of nested derived-store nodes. RFC05 L346 repeats the guarantee; narrowing documentation would hide supported behavior.

**Versions/builds:** dafad1db34626feb5f154e98e599f65be1802c6c, public types; rc.13 also contradicts the same contract. HEAD-only regression: no.

**Evidence:** [minimal failing test and related issues](../../findings/018-nested-refresh-types/README.md).
