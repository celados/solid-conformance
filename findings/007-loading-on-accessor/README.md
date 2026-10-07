---
type: Issue
id: '007'
status: confirmed
versions: [2.0.0-rc.13, 53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712]
area: async/Loading
upstream: [https://github.com/solidjs/solid/issues/3728, https://github.com/solidjs/solid/issues/3524]
found_by: docs
---

# Loading's documented zero-argument on accessor never rearms

Expected: changing id in `on={() => { id(); return 1 }}` shows fallback again while
the replacement request is pending. Actual: the prior `<span>1</span>` stays visible.

## Run

```sh
bun test ./findings/007-loading-on-accessor/repro.test.ts
```

Fails on HEAD development/production and RC13. [RFC 05](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/05-async-data.md#loading-on-prop-dependencies-that-show-the-fallback-again)
explicitly says “A zero-argument function is a tracked accessor, not a callback.”
The JSX expression supplies a function value, which Loading does not call. The
documented callback form appears wrong for JSX; a reactive expression is the actual
public contract. Record this as a documentation/runtime contract discrepancy.

## Dedupe and shrinking

#3728 fixes @solidjs/html's conversion to a getter; this repro uses native-compiled
TSX, so that fix does not apply. #3524 discusses the outside-hold restriction;
this repro has one boundary and one consumer. Open/closed Loading on/accessor
searches covered all three repositories. Reduced to one id, one memo, two requests
and one Loading; the second request remains pending intentionally.
