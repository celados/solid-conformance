---
type: Issue
id: '004'
status: confirmed
versions: [53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712]
area: async/Loading
upstream: [https://github.com/solidjs/solid/issues/2997, https://github.com/solidjs/solid/issues/3769]
found_by: transitions
---

# Derived store drops a replacement request's rejection

Expected: a replacement async request rejecting reaches the enclosing Errored.
Actual: the DOM stays `<span>0</span>`; neither the fallback nor a client error report appears.

## Run

```sh
bun test ./findings/004-derived-store-rejection/repro.test.ts
```

Fails on HEAD in development and production; the minimal test passes on RC13. The corresponding memo
transition passes. [RFC 05](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/05-async-data.md)
makes Promises first-class for derived stores as well as memos; RFC 03 assigns error
routing to Errored. The runtime appears wrong: the same rejected request reaches the
nearest boundary for a memo, while the store masks it with the last settled value.

## Dedupe and shrinking

Open and closed searches across Solid, Router and Start covered store error,
projection rejection and rejection. #2997 is pre-shell SSR routing; #3769 is
serialized unhandled-rejection noise. Neither describes this client replacement
request losing its rejection. No exact duplicate was found.

fast-check shrank to seed 20261008 / path `2:2:2:2`, a promise-derived store and
argument-change/reject operations. Removed router, events, extra boundaries,
wrappers and extra fields. Replaced the first deferred request with a synchronous
initial value; one signal, one promise and one store remain. Loading covers the
pending read and Errored supplies the oracle.
