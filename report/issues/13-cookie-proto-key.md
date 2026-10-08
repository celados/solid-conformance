---
type: "Issue"
title: "[2.0 rc.13 + next] Cookie parser loses the valid __proto__ cookie name"
status: "withdrawn"
withdrawn: "2026-10-08: low real-world impact (unusual construct or type bypass)"
tier: "A"
severity: "low"
findings: ["026"]
target: "3086f1b77cd7b0431d3a7f768c2984c335758633"
snippet: "module.ts"
snippet_kind: "server-utility"
repro_commit: "b739f93a27c1d72c5269e15a7ada7543af9e5dbe"
filed: "https://github.com/solidjs/solid/issues/3899"
---

### Describe the bug

The cookie parser loses the valid __proto__ cookie name.

### Your Example Website or App

[Standalone reproduction](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/13-cookie-proto-key)

### Steps to Reproduce the Bug or Issue

1. Use the source below with the selected Solid build (complete setup is linked above).

```ts
import { parseCookieHeader } from "@solidjs/web";

export const parse = () => {
  const cookies = parseCookieHeader("__proto__=x"); // Parse a valid cookie name.
  console.log(cookies.__proto__); // Object.prototype, rather than "x".
  console.log(Object.hasOwn(cookies, "__proto__")); // false, rather than true.
  return cookies;
};
```

2. Run parse() in a server module using @solidjs/web. This is an HTTP utility; no component or browser is required.

### Expected behavior

**Expected:** The parsed cookie has its own __proto__ entry with value x.
**Actual:** The value is Object.prototype, and Object.hasOwn returns false.

### Platform

- Solid: `solid-js` / `@solidjs/web` next at `3086f1b77cd7b0431d3a7f768c2984c335758633`; comparison `2.0.0-rc.13`. Signals, compiler and diagnostics match the selected Solid build.
- OS: macOS 26.6.2 (25G83); browser cases: system Google Chrome 155.0.8059.40. Server-only/type checks run in Bun 1.4.2.
- Builds/comparison: development and production fail. rc.13 also fails the same case.

### Additional context

__proto__ is a valid cookie name. A parsed header should expose it as an own key rather than inherit Object.prototype.

Related: [#3239](https://github.com/solidjs/solid/issues/3239)

<details>
<summary>Full automated reproduction</summary>

[One-command setup, run and expected output](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/13-cookie-proto-key/README.md).

Copy [the standalone files](https://github.com/celados/solid-conformance/tree/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/13-cookie-proto-key) into a fresh Bun project. The displayed snippet is executed by repro.test.ts. The original automated case is also retained.

- [build.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/13-cookie-proto-key/build.ts)
- [link-head.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/13-cookie-proto-key/link-head.ts)
- [module.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/13-cookie-proto-key/module.ts)
- [repro.test.ts](https://github.com/celados/solid-conformance/blob/b739f93a27c1d72c5269e15a7ada7543af9e5dbe/report/repros/13-cookie-proto-key/repro.test.ts)

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
BUILD_MODE=development bun test ./repro.test.ts
```

The five linked packages must come from the same built HEAD checkout. Omitting the link step selects the rc.13 comparison. Chrome runs use the system installation.

</details>
