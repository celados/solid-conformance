---
type: Issue
id: '008'
status: confirmed
versions: [53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712]
area: async/Loading
upstream: [https://github.com/solidjs/solid/issues/3738, https://github.com/solidjs/solid/issues/3178]
found_by: docs
---

# Production refresh returns a promise that never settles

Expected: after the initial async memo settles, awaiting refresh delivers 2.
Actual in production: a 200ms watchdog wins and the DOM renders timeout; development delivers 2.

## Run

```sh
BUILD_MODE=production bun test ./findings/008-production-refresh/repro.test.ts
```

[RFC 05, refresh](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/05-async-data.md#refetch--refresh)
says “Accessor targets resolve with the settled value.” The runtime is wrong:
the public primitive's completion changes with the export condition. A never-settling
refresh breaks sequencing even when the compute returns an immediately resolved promise.

## Dedupe and shrinking

Open/closed refresh promise/hangs searches across the three repositories found
#3738's stack overflow with a racing write and #3178's isPending pulse. Neither
describes a lone refresh hanging only in production. Removed Loading, actions,
stores, argument changes and deferred sources; retained one memo, initial resolve
and refresh. The result signal and timer expose completion to the Chrome harness.
