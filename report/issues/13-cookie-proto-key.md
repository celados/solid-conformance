---
type: Issue
title: "Cookie parser loses the valid __proto__ cookie name"
status: draft
tier: A
severity: low
findings: ['026']
target: dafad1db34626feb5f154e98e599f65be1802c6c
snippet: module.ts
snippet_kind: server-utility
---

# Cookie parser loses the valid __proto__ cookie name

The cookie parser loses the valid __proto__ cookie name.

```ts
import { parseCookieHeader } from "@solidjs/web";

export const parse = () => {
  const cookies = parseCookieHeader("__proto__=x"); // Parse a valid cookie name.
  console.log(cookies.__proto__); // Object.prototype, rather than "x".
  console.log(Object.hasOwn(cookies, "__proto__")); // false, rather than true.
  return cookies;
};
```

Run parse() in a server module using @solidjs/web. This is an HTTP utility; no component or browser is required.

**Expected:** The parsed cookie has its own __proto__ entry with value x.
**Actual:** The value is Object.prototype, and Object.hasOwn returns false.

**Versions/builds:** HEAD `dafad1db34626feb5f154e98e599f65be1802c6c`; development and production fail. rc.13 also fails the same case.

Related: [#3239](https://github.com/solidjs/solid/issues/3239)

<details>
<summary>Full automated reproduction</summary>

Copy [the standalone files](../repros/13-cookie-proto-key/) into a fresh Bun project. The displayed snippet is executed by repro.test.ts. The original automated case is also retained.

- [build.ts](../repros/13-cookie-proto-key/build.ts)
- [link-head.ts](../repros/13-cookie-proto-key/link-head.ts)
- [module.ts](../repros/13-cookie-proto-key/module.ts)
- [repro.test.ts](../repros/13-cookie-proto-key/repro.test.ts)

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
bun run link-head.ts /absolute/path/to/built/solid
BUILD_MODE=development bun test ./repro.test.ts
```

The five linked packages must come from the same built HEAD checkout. Omitting the link step selects the rc.13 comparison. Chrome runs use the system installation.

</details>
